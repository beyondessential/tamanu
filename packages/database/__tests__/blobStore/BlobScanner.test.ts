import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Op } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BLOB_INTEGRITY_STATES, BLOB_SCAN_VERDICTS } from '@tamanu/constants';

import { BlobStore } from '../../src/blobStore/BlobStore';
import { BlobScanner } from '../../src/blobStore/scanning/BlobScanner';
import { BlobScannerUnavailableError } from '../../src/blobStore/scanning/types';
import type { Blob } from '../../src/models/Blob';

interface FakeRow {
  id: string;
  hash: string;
  size: number;
  integrityState: string;
  tier: string;
  lastScrubbedAt: Date | null;
  createdAt: Date;
  scanVerdict: string | null;
  scannedAt: Date | null;
  scannerVersion: string | null;
  signatureVersion: string | null;
}

// In-memory Blob registry covering the scan pass's query shape: the integrity
// and size filters, the never-scanned-or-signatures-moved-on disjunction, and
// the never-scanned-first ordering.
function makeFakeBlobModel() {
  const rows = new Map<string, FakeRow>();
  let inserted = 0;

  const isDue = (row: FakeRow, signatureVersion: string) =>
    row.scanVerdict === null ||
    (row.scanVerdict === BLOB_SCAN_VERDICTS.CLEAN && row.signatureVersion !== signatureVersion);

  return {
    rows,
    async findOne({ where }: { where: { hash: string } }) {
      return rows.get(where.hash) ?? null;
    },
    async findAll({ where, limit }: { where: Record<string | symbol, any>; limit?: number }) {
      const maxScanBytes = where.size[Op.lte] as number;
      const [, staleSignatures] = where[Op.or];
      const signatureVersion = staleSignatures.signatureVersion[Op.ne] as string;
      return [...rows.values()]
        .filter(
          row =>
            row.integrityState === where.integrityState &&
            row.size <= maxScanBytes &&
            isDue(row, signatureVersion),
        )
        .sort((a, b) => {
          const left = a.scannedAt?.getTime() ?? -Infinity;
          const right = b.scannedAt?.getTime() ?? -Infinity;
          return left - right || a.createdAt.getTime() - b.createdAt.getTime();
        })
        .slice(0, limit);
    },
    async update(values: Partial<FakeRow>, { where }: { where: { hash: string } }) {
      const row = rows.get(where.hash);
      if (row) {
        Object.assign(row, values);
      }
    },
    sequelize: {
      async query(_sql: string, { bind }: { bind: Record<string, any> }) {
        if (!rows.has(bind.hash)) {
          inserted += 1;
          rows.set(bind.hash, {
            id: bind.id,
            hash: bind.hash,
            size: bind.size,
            integrityState: bind.integrityState,
            tier: bind.tier,
            lastScrubbedAt: null,
            createdAt: new Date(inserted * 1000),
            scanVerdict: null,
            scannedAt: null,
            scannerVersion: null,
            signatureVersion: null,
          });
        }
      },
    },
  };
}

const SCANNER_VERSION = 'ClamAV 1.0.5';
const SIGNATURE_VERSION = '27100';

describe('BlobScanner', () => {
  let root: string;
  let fakeBlob: ReturnType<typeof makeFakeBlobModel>;
  let store: BlobStore;
  let quarantined: string[];
  let scanned: string[];

  const makeScanner = ({
    verdicts = new Map<string, string>(),
    maxBlobs = 100,
    maxBytes = 1_000_000,
    maxScanBytes = 1_000_000,
    signatureVersion = SIGNATURE_VERSION,
    versions,
    scan,
  }: {
    verdicts?: Map<string, string>;
    maxBlobs?: number;
    maxBytes?: number;
    maxScanBytes?: number;
    signatureVersion?: string;
    versions?: () => Promise<{ scannerVersion: string; signatureVersion: string }>;
    scan?: (target: { hash: string }) => Promise<string>;
  } = {}) =>
    new BlobScanner({
      blobStore: store,
      models: { Blob: fakeBlob as unknown as typeof Blob },
      driver: {
        versions: versions ?? (async () => ({ scannerVersion: SCANNER_VERSION, signatureVersion })),
        scan:
          scan ??
          (async ({ hash, open }: any) => {
            // Read the bytes the way a real driver would, so a scan that cannot
            // reach the content fails here rather than passing silently.
            const stream = await open();
            for await (const _chunk of stream) {
              // drained
            }
            scanned.push(hash);
            return verdicts.get(hash) ?? BLOB_SCAN_VERDICTS.CLEAN;
          }),
      } as any,
      getLimits: async () => ({ maxBlobs, maxBytes, maxScanBytes }),
      onInfected: async hash => {
        quarantined.push(hash);
      },
      log: { info: () => {}, warn: () => {} },
    });

  const put = async (content: string) =>
    (await store.put(Readable.from(Buffer.from(content)))).hash;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-scanner-test-'));
    fakeBlob = makeFakeBlobModel();
    quarantined = [];
    scanned = [];
    store = new BlobStore({
      root,
      models: { Blob: fakeBlob as unknown as typeof Blob },
      getFreeDiskReserveBytes: async () => 0,
      statfs: async () => ({ bavail: 1_000_000, bsize: 4096 }),
    });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  // verifies spec: AV — a blob is admitted unscanned and the pass records the
  // verdict afterwards, with the versions that produced it
  it('records a verdict with the scanner and signature versions behind it', async () => {
    const hash = await put('hello world');

    const result = await makeScanner().run();

    expect(result).toMatchObject({ scanned: 1, clean: 1, infected: 0 });
    const row = fakeBlob.rows.get(hash)!;
    expect(row.scanVerdict).toBe(BLOB_SCAN_VERDICTS.CLEAN);
    expect(row.scannerVersion).toBe(SCANNER_VERSION);
    expect(row.signatureVersion).toBe(SIGNATURE_VERSION);
    expect(row.scannedAt).toBeInstanceOf(Date);
  });

  // verifies spec: AV — an infected verdict is recorded and handed to the
  // server, which is what quarantines the hash and propagates it
  it('hands an infected hash to the server for quarantine', async () => {
    const hash = await put('infected content');

    const result = await makeScanner({
      verdicts: new Map([[hash, BLOB_SCAN_VERDICTS.INFECTED]]),
    }).run();

    expect(result).toMatchObject({ infected: 1, clean: 0 });
    expect(quarantined).toEqual([hash]);
    expect(fakeBlob.rows.get(hash)!.scanVerdict).toBe(BLOB_SCAN_VERDICTS.INFECTED);
  });

  it('leaves a blob alone once it has been scanned under the current signatures', async () => {
    await put('hello world');
    await makeScanner().run();

    const second = await makeScanner().run();

    expect(second.scanned).toBe(0);
    expect(scanned).toHaveLength(1);
  });

  // verifies spec: AV — blobs are re-scanned when the scanner's signatures are
  // updated, which the pass notices by comparing versions rather than by being
  // told
  it('re-scans a clean blob once the signatures have moved on', async () => {
    const hash = await put('hello world');
    await makeScanner().run();

    await makeScanner({ signatureVersion: '27101' }).run();

    expect(scanned).toEqual([hash, hash]);
    expect(fakeBlob.rows.get(hash)!.signatureVersion).toBe('27101');
  });

  it('does not re-scan an infected blob when the signatures move on', async () => {
    const hash = await put('infected content');
    await makeScanner({ verdicts: new Map([[hash, BLOB_SCAN_VERDICTS.INFECTED]]) }).run();

    const second = await makeScanner({ signatureVersion: '27101' }).run();

    expect(second.scanned).toBe(0);
  });

  // verifies spec: AV — content over the cap is left unscanned rather than sent,
  // and does not consume the pass it would otherwise sit at the head of
  it('leaves content over the size cap unscanned without starving the rest', async () => {
    const big = await put('a blob larger than the cap');
    const small = await put('small');

    const result = await makeScanner({ maxScanBytes: 10 }).run();

    expect(scanned).toEqual([small]);
    expect(result.scanned).toBe(1);
    expect(fakeBlob.rows.get(big)!.scanVerdict).toBeNull();
  });

  // verifies spec: AV — a scanner that cannot be reached leaves content
  // unscanned; nothing is recorded and nothing is refused
  it('ends the pass when the scanner goes away mid-pass', async () => {
    const first = await put('hello world');
    await put('second blob');

    const result = await makeScanner({
      scan: async ({ hash }) => {
        if (hash === first) {
          return BLOB_SCAN_VERDICTS.CLEAN;
        }
        throw new BlobScannerUnavailableError('clamd is unreachable');
      },
    }).run();

    expect(result).toMatchObject({ scanned: 1, unavailable: true });
    expect([...fakeBlob.rows.values()].filter(row => row.scanVerdict === null)).toHaveLength(1);
  });

  it('skips the pass entirely when the scanner cannot be reached at all', async () => {
    await put('hello world');

    const result = await makeScanner({
      versions: async () => {
        throw new BlobScannerUnavailableError('clamd is unreachable');
      },
    }).run();

    expect(result).toMatchObject({ scanned: 0, unavailable: true });
    expect(scanned).toEqual([]);
  });

  it('stops on the byte budget and reports the pass as rate limited', async () => {
    await put('hello world');
    await put('second blob');

    const result = await makeScanner({ maxBytes: 1 }).run();

    expect(result).toMatchObject({ scanned: 1, ratelimited: true });
  });

  // verifies spec: AV, SCRUB — a corrupt blob has no servable bytes to hold a
  // verdict about, so the scan leaves it to the scrub
  it('does not scan corrupt content', async () => {
    const hash = await put('hello world');
    fakeBlob.rows.get(hash)!.integrityState = BLOB_INTEGRITY_STATES.CORRUPT;

    const result = await makeScanner().run();

    expect(result.scanned).toBe(0);
    expect(scanned).toEqual([]);
  });

  it('carries on past a blob whose bytes have gone', async () => {
    const missing = await put('hello world');
    const held = await put('second blob');
    const digest = missing.split(':')[1];
    await fs.rm(path.join(root, 'sha256', digest.slice(0, 2), digest.slice(2, 4), digest.slice(4)));

    const result = await makeScanner().run();

    expect(scanned).toEqual([held]);
    expect(result.scanned).toBe(1);
  });
});
