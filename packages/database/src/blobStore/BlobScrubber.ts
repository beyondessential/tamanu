import { Op, literal } from 'sequelize';

import { BLOB_INTEGRITY_STATES } from '@tamanu/constants';

import type { BlobStore } from './BlobStore';
import type { Blob } from '../models/Blob';

// spec: SCRUB
// What a scrub found wrong with a blob. `corrupt` bytes are held but no longer
// hash to their name; `missing` bytes are named by a registry entry the store
// cannot satisfy. Both are faults only where the content must be durably
// present, which is the healer's judgement, not the scrubber's.
export const BLOB_FAULTS = {
  CORRUPT: 'corrupt',
  MISSING: 'missing',
} as const;

export type BlobFault = (typeof BLOB_FAULTS)[keyof typeof BLOB_FAULTS];

// Hashes checked for registration per query while reconciling the store against
// the registry, so a store with many files costs a query per batch rather than
// one per file.
const RECONCILE_EXISTENCE_BATCH = 500;

export interface BlobFaultReport {
  hash: string;
  fault: BlobFault;
  /** The registry row as it stood when the fault was found, where there is one. */
  blob: Blob | null;
}

export interface ScrubPassLimits {
  /** Registry rows verified in one pass. */
  maxBlobs: number;
  /** Bytes read in one pass; the last blob may take the total past it. */
  maxBytes: number;
}

export interface ScrubResult {
  verified: number;
  faults: number;
  adopted: number;
  /** Covered blobs the pass brought under parity protection. */
  protected: number;
  bytesRead: number;
  /** True when the pass stopped on a limit rather than exhausting its work. */
  ratelimited: boolean;
}

export interface BlobScrubberOptions {
  blobStore: BlobStore;
  models: { Blob: typeof Blob };
  getLimits: () => Promise<ScrubPassLimits>;
  /**
   * Severity grading and the repair ladder, supplied by the server: what a
   * fault means differs between an authoritative copy and a refetchable one.
   */
  heal: (report: BlobFaultReport) => Promise<void>;
  /**
   * Hashes that must be durably present on this server but are not held —
   * central's referenced-and-delivered blobs. A facility's equivalent is its
   * outbox, which the verification pass already covers, so it supplies none.
   */
  findUndeliverableReferences?: (limit: number) => Promise<string[]>;
  log: {
    info: (message: string, meta?: object) => void;
    warn: (message: string, meta?: object) => void;
  };
}

// spec: SCRUB
// The scheduled integrity scrub: verify stored blobs against their hashes,
// covering content that is never read, and reconcile the registry against the
// store in both directions. Detection only — grading a fault and repairing it
// belong to the healer this is constructed with, because an authoritative copy
// and a refetchable cache copy warrant different responses to identical bytes.
export class BlobScrubber {
  #blobStore: BlobStore;
  #models: { Blob: typeof Blob };
  #getLimits: () => Promise<ScrubPassLimits>;
  #heal: (report: BlobFaultReport) => Promise<void>;
  #findUndeliverableReferences?: (limit: number) => Promise<string[]>;
  #log: BlobScrubberOptions['log'];

  constructor({
    blobStore,
    models,
    getLimits,
    heal,
    findUndeliverableReferences,
    log,
  }: BlobScrubberOptions) {
    this.#blobStore = blobStore;
    this.#models = models;
    this.#getLimits = getLimits;
    this.#heal = heal;
    this.#findUndeliverableReferences = findUndeliverableReferences;
    this.#log = log;
  }

  // spec: SCRUB
  /**
   * One incremental pass: verify a bounded batch of the least-recently-scrubbed
   * blobs, reconcile the store against the registry, and check the referential
   * integrity of content that must be durably present. Bounded by both blob
   * count and bytes read, so every blob is covered across successive passes
   * rather than in one sweep of the whole store.
   */
  async run(): Promise<ScrubResult> {
    const limits = await this.#getLimits();
    const result: ScrubResult = {
      verified: 0,
      faults: 0,
      adopted: 0,
      protected: 0,
      bytesRead: 0,
      ratelimited: false,
    };

    await this.#verificationPass(limits, result);
    await this.#reconciliationPass(limits, result);
    await this.#referentialPass(limits, result);
    await this.#parityPass(limits, result);

    this.#log.info('BlobScrubber: pass complete', { ...result });
    return result;
  }

  // spec: SCRUB
  // Least-recently-scrubbed first, never-scrubbed ahead of all: a blob admitted
  // today is verified before one checked last week, and the whole population is
  // covered within the target cycle without tracking a cursor across passes.
  //
  // Corrupt blobs are skipped: their bytes are known-bad and on disk, so
  // re-hashing them every pass would burn the byte budget to re-learn what is
  // already recorded. Absent blobs are kept in the scan but treated specially:
  // re-checking one is cheap (its bytes are missing, so there is nothing to
  // hash) and it is how the scrub notices the bytes coming back — a backup
  // restore, say. While an absent blob stays missing it is neither re-reported
  // nor re-repaired, only re-stamped so it yields its slot to unchecked blobs;
  // once its bytes return and verify, it flips back to verified.
  async #verificationPass(limits: ScrubPassLimits, result: ScrubResult): Promise<void> {
    const candidates = await this.#models.Blob.findAll({
      where: { integrityState: { [Op.ne]: BLOB_INTEGRITY_STATES.CORRUPT } },
      order: [
        ['lastScrubbedAt', 'ASC NULLS FIRST'],
        ['createdAt', 'ASC'],
      ],
      limit: limits.maxBlobs,
    });

    // The happy path is that a blob verifies; stamp those as a single batch at
    // the end rather than one write each, since a pass verifies up to maxBlobs.
    // A fault is rarer and its state is written through the heal path per blob.
    const verified: string[] = [];
    // Absent blobs that are still missing: their state does not change, but
    // their scrub time does, so they don't monopolise the next pass's scan.
    const stillAbsent: string[] = [];
    const flush = async () => {
      await this.#blobStore.recordVerified(verified);
      await this.#blobStore.touchScrubbed(stillAbsent);
    };

    for (const blob of candidates) {
      if (result.bytesRead >= limits.maxBytes) {
        result.ratelimited = true;
        await flush();
        return;
      }
      const outcome = await this.#blobStore.verify(blob.hash);
      result.bytesRead += outcome.size;

      if (outcome.held && outcome.matches) {
        // Covers recovery: an absent blob whose bytes have returned verifies
        // here and is stamped back to verified along with the happy path.
        verified.push(blob.hash);
        result.verified += 1;
        continue;
      }

      if (!outcome.held && blob.integrityState === BLOB_INTEGRITY_STATES.ABSENT) {
        // Already recorded absent and still missing: re-checking found no
        // change, so don't re-escalate or re-attempt a repair — just note it
        // was looked at.
        stillAbsent.push(blob.hash);
        continue;
      }

      result.faults += 1;
      await this.#reportFault({
        hash: blob.hash,
        fault: outcome.held ? BLOB_FAULTS.CORRUPT : BLOB_FAULTS.MISSING,
        blob,
      });
    }

    await flush();
    result.ratelimited ||= candidates.length === limits.maxBlobs;
  }

  // spec: SCRUB
  // The store's own contents, so bytes no registry entry names are found. Such
  // a blob is otherwise permanent: never served, and never reclaimed, since a
  // facility evicts against a budget derived from the registry.
  //
  // The walk covers the whole store each pass, because an orphan can sit under
  // any fan-out prefix and a bounded walk without a cursor would only ever see
  // the same slice. What is kept off the clinical path is the cost that scales:
  // registration is checked a batch of hashes at a time rather than one query
  // per file, and the expensive part — re-hashing an orphan's content — is
  // bounded by the same blob and byte budget as verification, with the rest
  // deferred to a later pass (an unregistered blob stays found until adopted).
  async #reconciliationPass(limits: ScrubPassLimits, result: ScrubResult): Promise<void> {
    let batch: string[] = [];
    let orphansExamined = 0;
    let stop = false;

    const drainBatch = async (): Promise<void> => {
      if (batch.length === 0) {
        return;
      }
      const hashes = batch;
      batch = [];
      const registered = new Set(
        (
          await this.#models.Blob.findAll({ where: { hash: hashes }, attributes: ['hash'] })
        ).map(row => row.hash),
      );
      for (const hash of hashes) {
        if (registered.has(hash)) {
          continue;
        }
        if (orphansExamined >= limits.maxBlobs || result.bytesRead >= limits.maxBytes) {
          // Budget spent on found orphans; the rest stay unregistered on disk
          // and are found again next pass, so coverage is not lost.
          result.ratelimited = true;
          stop = true;
          return;
        }
        orphansExamined += 1;
        await this.#reconcileOrphan(hash, result);
      }
    };

    for await (const hash of this.#blobStore.storedHashes()) {
      batch.push(hash);
      if (batch.length >= RECONCILE_EXISTENCE_BATCH) {
        await drainBatch();
        if (stop) {
          return;
        }
      }
    }
    await drainBatch();
  }

  async #reconcileOrphan(hash: string, result: ScrubResult): Promise<void> {
    // Verified against the hash its own location encodes: bytes that match are
    // usable content whatever left them unregistered, and bytes that do not are
    // corrupt in the ordinary way.
    const outcome = await this.#blobStore.verify(hash);
    result.bytesRead += outcome.size;
    if (!outcome.held) {
      // Removed between the walk and the read; nothing to reconcile.
      return;
    }
    // Registered either way. Bytes that match become usable content; bytes that
    // do not need a registry row before they can be recorded corrupt, which is
    // what retains them for investigation and keeps them from being served. Both
    // beat leaving them stranded on disk, where nothing serves them and nothing
    // reclaims them.
    await this.#blobStore.adopt(hash, outcome.size);
    if (!outcome.matches) {
      await this.#blobStore.recordIntegrityState(hash, BLOB_INTEGRITY_STATES.CORRUPT);
      result.faults += 1;
      await this.#reportFault({
        hash,
        fault: BLOB_FAULTS.CORRUPT,
        blob: await this.#models.Blob.findOne({ where: { hash } }),
      });
      return;
    }

    await this.#blobStore.recordIntegrityState(hash, BLOB_INTEGRITY_STATES.VERIFIED);
    result.adopted += 1;
    this.#log.info('BlobScrubber: adopted an unregistered blob', { hash, size: outcome.size });
  }

  // spec: SCRUB
  // Content the server is expected to be able to serve but does not hold at
  // all — no registry row, so the verification pass cannot see it. Reported the
  // same way as corruption, since the consequence is identical.
  async #referentialPass(limits: ScrubPassLimits, result: ScrubResult): Promise<void> {
    if (!this.#findUndeliverableReferences) {
      return;
    }
    const hashes = await this.#findUndeliverableReferences(limits.maxBlobs);
    for (const hash of hashes) {
      result.faults += 1;
      await this.#reportFault({ hash, fault: BLOB_FAULTS.MISSING, blob: null });
    }
  }

  // spec: FEC
  // Parity for covered blobs that carry none, so enabling error correction brings
  // content already stored under protection over a scrub cycle rather than
  // protecting only new writes.
  //
  // Its own byte budget, bounded by the same limit as verification rather than
  // sharing one counter with it: once the store is covered, verification spends
  // its whole budget every pass, so a shared counter would starve the retrofit
  // indefinitely. The extra reads are transient — once every covered blob has
  // parity, this pass is one indexed query that finds nothing.
  async #parityPass(limits: ScrubPassLimits, result: ScrubResult): Promise<void> {
    if (!(await this.#blobStore.parityEnabled())) {
      return;
    }
    const { minimumSize, tiers } = this.#blobStore.parityCoverage;
    const candidates = await this.#models.Blob.findAll({
      where: {
        hasParity: false,
        integrityState: BLOB_INTEGRITY_STATES.VERIFIED,
        // spec: AV — quarantined content is retained but never served and never
        // repaired, so parity over it protects bytes nothing will ever read. A
        // subquery rather than a fetched list, which a mass quarantine would
        // otherwise grow without bound.
        hash: {
          [Op.notIn]: literal('(SELECT hash FROM blob_quarantines WHERE deleted_at IS NULL)'),
        },
        // Rows the store would refuse anyway: fetched, they spend the pass's
        // limit on skips while covered blobs behind them wait another cycle.
        size: { [Op.gte]: minimumSize },
        tier: [...tiers],
      },
      order: [
        ['lastScrubbedAt', 'ASC NULLS FIRST'],
        ['createdAt', 'ASC'],
      ],
      limit: limits.maxBlobs,
    });

    let bytesRead = 0;
    for (const blob of candidates) {
      if (bytesRead >= limits.maxBytes) {
        result.ratelimited = true;
        return;
      }
      // One read per blob: the encode hashes the bytes it reads, so a blob that
      // has rotted since its last scrub is left unprotected without a second
      // pass over it to find that out. The fault is the verification pass's,
      // which reaches the blob on its own.
      const outcome = await this.#blobStore.writeParity(blob);
      bytesRead += outcome.bytesRead;
      result.bytesRead += outcome.bytesRead;
      if (outcome.protected) {
        result.protected += 1;
      }
    }
    result.ratelimited ||= candidates.length === limits.maxBlobs;
  }

  async #reportFault(report: BlobFaultReport): Promise<void> {
    try {
      await this.#heal(report);
    } catch (error) {
      // One blob that cannot be healed must not end the pass: the rest of the
      // store still needs checking, and the fault stays recorded for the next.
      this.#log.warn('BlobScrubber: self-heal failed', {
        hash: report.hash,
        fault: report.fault,
        error: (error as Error).message,
      });
    }
  }
}
