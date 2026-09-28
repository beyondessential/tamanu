import { Op, literal } from 'sequelize';

import { BLOB_INTEGRITY_STATES } from '@tamanu/constants';

import type { BlobStore } from './BlobStore';
import type { Blob } from '../models/Blob';

// spec: SCRUB
// Both are faults only where the content must be durably present, which is the healer's call.
export const BLOB_FAULTS = {
  CORRUPT: 'corrupt',
  MISSING: 'missing',
} as const;

export type BlobFault = (typeof BLOB_FAULTS)[keyof typeof BLOB_FAULTS];

const RECONCILE_EXISTENCE_BATCH = 500;

export interface BlobFaultReport {
  hash: string;
  fault: BlobFault;
  blob: Blob | null;
}

export interface ScrubPassLimits {
  maxBlobs: number;
  /** The last blob may take the total past it. */
  maxBytes: number;
}

export interface ScrubResult {
  verified: number;
  faults: number;
  adopted: number;
  protected: number;
  bytesRead: number;
  ratelimited: boolean;
}

export interface BlobScrubberOptions {
  blobStore: BlobStore;
  models: { Blob: typeof Blob };
  getLimits: () => Promise<ScrubPassLimits>;
  heal: (report: BlobFaultReport) => Promise<void>;
  /** A facility supplies none: its outbox is already covered by the verification pass. */
  findUndeliverableReferences?: (limit: number) => Promise<string[]>;
  log: {
    info: (message: string, meta?: object) => void;
    warn: (message: string, meta?: object) => void;
  };
}

// spec: SCRUB
// Detection only: an authoritative copy and a refetchable cache copy need different repairs, so the
// healer decides.
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
  // Corrupt blobs are skipped: re-hashing known-bad bytes would burn the budget. Absent blobs stay
  // in the scan, since re-checking is cheap and it's how a restored blob is noticed.
  async #verificationPass(limits: ScrubPassLimits, result: ScrubResult): Promise<void> {
    const candidates = await this.#models.Blob.findAll({
      where: { integrityState: { [Op.ne]: BLOB_INTEGRITY_STATES.CORRUPT } },
      order: [
        ['lastScrubbedAt', 'ASC NULLS FIRST'],
        ['createdAt', 'ASC'],
      ],
      limit: limits.maxBlobs,
    });

    const verified: string[] = [];
    // Re-stamped so they don't monopolise the next pass.
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
        // An absent blob whose bytes returned verifies here.
        verified.push(blob.hash);
        result.verified += 1;
        continue;
      }

      if (!outcome.held && blob.integrityState === BLOB_INTEGRITY_STATES.ABSENT) {
        // Still absent: don't re-escalate or re-attempt a repair.
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
  // Walks the whole store each pass: an orphan can sit under any prefix and there's no cursor. Re-
  // hashing orphans is bounded by the verification budget.
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
          // Unadopted orphans are found again next pass.
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
    const outcome = await this.#blobStore.verify(hash);
    result.bytesRead += outcome.size;
    if (!outcome.held) {
      return;
    }
    // Mismatched bytes need a registry row before they can be recorded corrupt.
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
  // Its own byte budget: once the store is covered, verification spends its whole budget every pass
  // and would starve a shared counter.
  async #parityPass(limits: ScrubPassLimits, result: ScrubResult): Promise<void> {
    if (!(await this.#blobStore.parityEnabled())) {
      return;
    }
    const { minimumSize, tiers } = this.#blobStore.parityCoverage;
    const candidates = await this.#models.Blob.findAll({
      where: {
        hasParity: false,
        integrityState: BLOB_INTEGRITY_STATES.VERIFIED,
        // spec: AV
        // A subquery, since a mass quarantine would grow a fetched list without bound.
        hash: {
          [Op.notIn]: literal('(SELECT hash FROM blob_quarantines WHERE deleted_at IS NULL)'),
        },
        // Fetching rows the store would refuse spends the limit on skips.
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
      // The encode hashes as it reads, so a rotted blob is left unprotected without a second read.
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
      // One unhealable blob must not end the pass.
      this.#log.warn('BlobScrubber: self-heal failed', {
        hash: report.hash,
        fault: report.fault,
        error: (error as Error).message,
      });
    }
  }
}
