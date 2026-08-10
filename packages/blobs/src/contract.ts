import { BLOB_TIERS, CURRENT_BLOB_HASH_ALGORITHM, type BlobTier } from '@tamanu/constants';
import { formatBlobHash } from '@tamanu/utils/blobs';

// Known digests, so a host that hashes differently fails here rather than
// silently storing content under an identity the other host can't resolve.
const EMPTY_CONTENT_HASH = 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const HELLO_WORLD = 'hello world';
const HELLO_WORLD_HASH =
  'sha256:b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

export interface RegistryRow {
  tier: string;
  /**
   * An instant, not a raw storage string: hosts store timestamps in their own
   * formats, and SQLite's `datetime('now')` in particular reads back as a
   * timezone-less string that parses as local time. Each harness normalises.
   */
  lastAccessedAt: Date | number;
  deletedAt: Date | number | null;
}

/**
 * What a host has to expose for the contract suite to drive it. Beyond the
 * ports the package uses in anger, it includes the few hooks a test needs to
 * arrange state (soft-delete a row, age an access) — hosts implement those in
 * their own test harness, not in production code.
 */
export interface BlobHostUnderTest {
  /** Writes content to a scratch file and returns its path. */
  writeScratchFile(content: string): Promise<string>;
  hashFile(path: string, algorithm: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
  pathFor(hash: string): string;
  place(fromPath: string, toPath: string): Promise<void>;
  /**
   * Admits the given content under the tier, storing it so its computed hash is
   * the one the suite then looks up. Takes the content rather than a hash so the
   * stored identity genuinely matches, instead of the host faking admission with
   * fixed bytes that only happen to hash to what each case expects.
   */
  register(content: string, tier: BlobTier): Promise<void>;
  row(hash: string): Promise<RegistryRow | null>;
  softDelete(hash: string): Promise<void>;
  delete(hash: string): Promise<void>;
  touch(hash: string, options: { coalesceSeconds: number }): Promise<void>;
  setLastAccessedAt(hash: string, when: Date): Promise<void>;
  stagedSize(hash: string): Promise<number>;
  /** Appends a received part to the staging, returning the new staged size. */
  stageAppendPart(hash: string, content: string): Promise<number>;
  discardStaged(hash: string): Promise<void>;
}

export interface ContractCase {
  name: string;
  run: (host: BlobHostUnderTest) => Promise<void>;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`contract: ${message}`);
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  assert(actual === expected, `${message} (got ${String(actual)}, expected ${String(expected)})`);
}

const timeOf = (value: Date | number) => new Date(value).getTime();

/**
 * The suite every host implementation must pass, so a divergence fails on the
 * host that diverged rather than surfacing as content one side cannot resolve.
 * Framework-agnostic: each case throws on failure, and the host's own test file
 * feeds them to whatever runner it uses.
 */
export const BLOB_HOST_CONTRACT: ContractCase[] = [
  {
    // spec: CAS
    name: 'hashFile returns the algorithm-tagged hash of the bytes on disk',
    async run(host) {
      const path = await host.writeScratchFile(HELLO_WORLD);
      const digest = await host.hashFile(path, CURRENT_BLOB_HASH_ALGORITHM);
      assertEqual(
        formatBlobHash(CURRENT_BLOB_HASH_ALGORITHM, digest),
        HELLO_WORLD_HASH,
        'hash of known content',
      );
    },
  },
  {
    // spec: CAS
    name: 'hashFile of empty content returns the defined empty hash',
    async run(host) {
      const path = await host.writeScratchFile('');
      const digest = await host.hashFile(path, CURRENT_BLOB_HASH_ALGORITHM);
      assertEqual(
        formatBlobHash(CURRENT_BLOB_HASH_ALGORITHM, digest),
        EMPTY_CONTENT_HASH,
        'hash of empty content',
      );
    },
  },
  {
    // spec: CACHE
    name: 'registry upsert leaves a live row untouched, so cache stays cache',
    async run(host) {
      await host.register(HELLO_WORLD, BLOB_TIERS.CACHE);
      const before = await host.row(HELLO_WORLD_HASH);
      assert(before, 'row exists after first register');

      await host.register(HELLO_WORLD, BLOB_TIERS.OUTBOX);
      const after = await host.row(HELLO_WORLD_HASH);

      assertEqual(after?.tier, BLOB_TIERS.CACHE, 'tier of a live row after re-admission');
      assertEqual(
        timeOf(after!.lastAccessedAt),
        timeOf(before.lastAccessedAt),
        'recency of a live row after re-admission',
      );
    },
  },
  {
    // spec: CAS
    name: 'registry upsert resurrects a soft-deleted row with the incoming tier and reset recency',
    async run(host) {
      await host.register(HELLO_WORLD, BLOB_TIERS.CACHE);
      await host.setLastAccessedAt(HELLO_WORLD_HASH, new Date(Date.now() - 60 * 60 * 1000));
      await host.softDelete(HELLO_WORLD_HASH);

      await host.register(HELLO_WORLD, BLOB_TIERS.OUTBOX);
      const row = await host.row(HELLO_WORLD_HASH);

      assert(row, 'row exists after resurrection');
      assertEqual(row.deletedAt, null, 'deletedAt after resurrection');
      assertEqual(row.tier, BLOB_TIERS.OUTBOX, 'tier after resurrection');
      assert(
        Date.now() - timeOf(row.lastAccessedAt) < 60 * 1000,
        'recency is reset on resurrection rather than left stale',
      );
    },
  },
  {
    // spec: CAS
    name: 'registry upsert is atomic under concurrent admission of the same content',
    async run(host) {
      await Promise.all(
        Array.from({ length: 5 }, () => host.register(HELLO_WORLD, BLOB_TIERS.CACHE)),
      );
      const row = await host.row(HELLO_WORLD_HASH);
      assert(row, 'exactly one row survives concurrent admission');
    },
  },
  {
    // spec: CACHE
    name: 'recency update is a no-op within the coalesce window and applies outside it',
    async run(host) {
      await host.register(HELLO_WORLD, BLOB_TIERS.CACHE);
      const fresh = await host.row(HELLO_WORLD_HASH);

      await host.touch(HELLO_WORLD_HASH, { coalesceSeconds: 60 });
      const coalesced = await host.row(HELLO_WORLD_HASH);
      assertEqual(
        timeOf(coalesced!.lastAccessedAt),
        timeOf(fresh!.lastAccessedAt),
        'recency within the coalesce window',
      );

      const stale = new Date(Date.now() - 10 * 60 * 1000);
      await host.setLastAccessedAt(HELLO_WORLD_HASH, stale);
      await host.touch(HELLO_WORLD_HASH, { coalesceSeconds: 60 });
      const refreshed = await host.row(HELLO_WORLD_HASH);
      assert(
        timeOf(refreshed!.lastAccessedAt) > stale.getTime(),
        'recency outside the coalesce window',
      );
    },
  },
  {
    // spec: CAS
    name: 'delete is hard, so the same hash can be re-admitted afterwards',
    async run(host) {
      await host.register(HELLO_WORLD, BLOB_TIERS.CACHE);
      await host.delete(HELLO_WORLD_HASH);
      assertEqual(await host.row(HELLO_WORLD_HASH), null, 'row after delete');

      await host.register(HELLO_WORLD, BLOB_TIERS.OUTBOX);
      const row = await host.row(HELLO_WORLD_HASH);
      assertEqual(row?.tier, BLOB_TIERS.OUTBOX, 'tier after re-admission');
    },
  },
  {
    // spec: CAS
    name: 'placement into the fan-out path leaves the content whole and the source gone',
    async run(host) {
      const scratch = await host.writeScratchFile(HELLO_WORLD);
      const finalPath = host.pathFor(HELLO_WORLD_HASH);

      await host.place(scratch, finalPath);

      assertEqual(await host.fileExists(finalPath), true, 'content at its fan-out path');
      assertEqual(await host.fileExists(scratch), false, 'source after placement');
      const digest = await host.hashFile(finalPath, CURRENT_BLOB_HASH_ALGORITHM);
      assertEqual(
        formatBlobHash(CURRENT_BLOB_HASH_ALGORITHM, digest),
        HELLO_WORLD_HASH,
        'placed content matches its hash',
      );
    },
  },
  {
    // spec: XFER
    name: 'staging accumulates appended parts and reports the size a resume starts from',
    async run(host) {
      assertEqual(await host.stagedSize(HELLO_WORLD_HASH), 0, 'staged size before any part');

      const afterFirst = await host.stageAppendPart(HELLO_WORLD_HASH, 'hello');
      assertEqual(afterFirst, 5, 'staged size after the first part');
      assertEqual(await host.stagedSize(HELLO_WORLD_HASH), 5, 'staged size as read back');

      const afterSecond = await host.stageAppendPart(HELLO_WORLD_HASH, ' world');
      assertEqual(afterSecond, 11, 'staged size after the second part');

      await host.discardStaged(HELLO_WORLD_HASH);
      assertEqual(await host.stagedSize(HELLO_WORLD_HASH), 0, 'staged size after discarding');
    },
  },
];
