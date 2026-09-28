import { BLOB_FAULTS } from '@tamanu/database/blobStore';
import {
  BLOB_INTEGRITY_STATES,
  BLOB_TIERS,
  FACT_BLOB_CACHE_FAULTS,
  FACT_BLOB_CACHE_FAULT_AT,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

// spec: SCRUB
// Graded by tier: a cache copy is durable on central, an outbox copy is the only one anywhere.
export class FacilityBlobHealer {
  #blobStore;
  #models;
  #transferChannel = null;

  constructor({ blobStore, models }) {
    this.#blobStore = blobStore;
    this.#models = models;
  }

  setTransferChannel(transferChannel) {
    this.#transferChannel = transferChannel;
  }

  // spec: SCRUB
  /**
   * Called by the scrub and the read path, so it must be safe to call repeatedly and concurrently.
   */
  async heal({ hash, fault, blob }) {
    // spec: AV
    // Every repair below ends with the same bytes held again, which for malware is the outcome to
    // avoid.
    if (await this.#models.BlobQuarantine.findOne({ where: { hash } })) {
      log.warn('FacilityBlobHealer: leaving quarantined content unrepaired', { hash, fault });
      return;
    }

    // spec: FEC
    // The first rung. A checked reconstruction means the content was never at risk, so it's
    // recorded verified.
    if (fault === BLOB_FAULTS.CORRUPT && (await this.#blobStore.repairFromParity(hash))) {
      log.info('FacilityBlobHealer: repaired a corrupt blob from its parity', { hash });
      return;
    }

    // spec: SCRUB
    // Reconciliation records a corrupt orphan before handing it here; the cache path would delete
    // the evidence.
    if (blob?.integrityState === BLOB_INTEGRITY_STATES.CORRUPT) {
      log.warn('FacilityBlobHealer: retaining a corrupt blob for investigation', {
        hash,
        fault,
      });
      return;
    }
    const tier = blob?.tier ?? BLOB_TIERS.CACHE;
    if (tier === BLOB_TIERS.OUTBOX) {
      await this.#healOutbox({ hash, fault });
      return;
    }
    await this.#healCache({ hash, fault });
  }

  // spec: SCRUB
  async #healCache({ hash, fault }) {
    await this.#blobStore.delete(hash);
    await this.#countCacheFault();
    log.warn('FacilityBlobHealer: dropped a faulty cache blob, it will refetch on demand', {
      hash,
      fault,
    });
  }

  // spec: SCRUB
  // The drop leaves the registry indistinguishable from an eviction, so the fault is counted here.
  async #countCacheFault() {
    const { LocalSystemFact } = this.#models;
    await LocalSystemFact.setIfAbsent(FACT_BLOB_CACHE_FAULTS, '0');
    await LocalSystemFact.incrementValue(FACT_BLOB_CACHE_FAULTS);
    await LocalSystemFact.set(FACT_BLOB_CACHE_FAULT_AT, getCurrentDateTimeString());
  }

  // spec: SCRUB
  // Central is worth trying: a push acknowledged but not demoted leaves exactly this state.
  async #healOutbox({ hash, fault }) {
    await this.#blobStore.recordIntegrityState(
      hash,
      fault === BLOB_FAULTS.CORRUPT
        ? BLOB_INTEGRITY_STATES.CORRUPT
        : BLOB_INTEGRITY_STATES.ABSENT,
    );

    if (await this.#refetchFromCentral(hash)) {
      await this.#models.Blob.update(
        { tier: BLOB_TIERS.CACHE, eligibleSinceTick: null },
        { where: { hash } },
      );
      // spec: FEC
      await this.#blobStore.discardParity(hash);
      log.warn('FacilityBlobHealer: repaired a faulty outbox blob from central', { hash, fault });
      return;
    }

    // Surfaced for the integrity healthcheck; see docs/runbooks/blob-integrity.md.
    log.error('FacilityBlobHealer: outbox blob is unrecoverable here and needs restoring', {
      hash,
      fault,
    });
  }

  async #refetchFromCentral(hash) {
    if (!this.#transferChannel) {
      return false;
    }
    try {
      await this.#transferChannel.fetchFromCentral(hash);
      return true;
    } catch (error) {
      log.debug('FacilityBlobHealer: central could not supply a replacement', {
        hash,
        error: error.message,
      });
      return false;
    }
  }
}
