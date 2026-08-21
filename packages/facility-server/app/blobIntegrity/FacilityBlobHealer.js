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
// The facility's response to a blob that fails verification. Severity is graded
// by the tier, which already records whether the copy is the only durable one:
// a cache copy is durable on central, so losing it costs a refetch, while an
// outbox copy is the only copy its content has anywhere.
export class FacilityBlobHealer {
  #blobStore;
  #models;
  #transferChannel = null;

  constructor({ blobStore, models }) {
    this.#blobStore = blobStore;
    this.#models = models;
  }

  /** Wired once the sync runtime is up; without it there is no peer to heal from. */
  setTransferChannel(transferChannel) {
    this.#transferChannel = transferChannel;
  }

  // spec: SCRUB
  /**
   * Repair a faulty blob, or escalate where it cannot be repaired here. Called
   * by the scrub and by the read path, so it must be safe to call for the same
   * hash repeatedly and concurrently.
   */
  async heal({ hash, fault, blob }) {
    // spec: AV — self-heal never resurrects known-bad content. Every repair
    // below ends in the same bytes being held again, and for a hash the
    // deployment has found to be malware that is the one outcome to avoid.
    if (await this.#models.BlobQuarantine.findOne({ where: { hash } })) {
      log.warn('FacilityBlobHealer: leaving quarantined content unrepaired', { hash, fault });
      return;
    }

    // spec: FEC — error correction is the first rung of the repair ladder, ahead
    // of dropping a cache copy or recording an outbox one corrupt. The
    // reconstruction is checked against the blob's hash, so a repair means the
    // content was never at risk: it is recorded verified rather than escalated.
    if (fault === BLOB_FAULTS.CORRUPT && (await this.#blobStore.repairFromParity(hash))) {
      log.info('FacilityBlobHealer: repaired a corrupt blob from its parity', { hash });
      return;
    }

    // spec: SCRUB — a corrupt blob is retained, never deleted. Reconciliation
    // records a corrupt orphan (unknown provenance, so not assumed to be a
    // refetchable replica) before handing it here; the cache path below would
    // otherwise delete the very evidence retention is meant to keep.
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
  // A cache copy is a replica: the content is durable on central, so the repair
  // is to stop holding the bad bytes and let the next read fetch them again.
  // Low-severity and self-correcting, so it is logged but not escalated.
  async #healCache({ hash, fault }) {
    await this.#blobStore.delete(hash);
    await this.#countCacheFault();
    log.warn('FacilityBlobHealer: dropped a faulty cache blob, it will refetch on demand', {
      hash,
      fault,
    });
  }

  // spec: SCRUB
  // Dropping the row is what makes the repair self-correcting, and it is also
  // what leaves the registry with nothing to report: the drop is indistinguishable
  // from an eviction, which deletes the row the same way. So the fault is counted
  // here, where "only a concern if it persists" has something to read.
  async #countCacheFault() {
    const { LocalSystemFact } = this.#models;
    await LocalSystemFact.setIfAbsent(FACT_BLOB_CACHE_FAULTS, '0');
    await LocalSystemFact.incrementValue(FACT_BLOB_CACHE_FAULTS);
    await LocalSystemFact.set(FACT_BLOB_CACHE_FAULT_AT, getCurrentDateTimeString());
  }

  // spec: SCRUB
  // An outbox copy is the only durable copy of its content, so a fault here is
  // real data loss unless a source can be found. Central is worth trying even
  // though the blob is un-pushed: a push that was acknowledged but whose
  // demotion did not land leaves exactly this state, and then the content is
  // there to be had.
  async #healOutbox({ hash, fault }) {
    await this.#blobStore.recordIntegrityState(
      hash,
      fault === BLOB_FAULTS.CORRUPT
        ? BLOB_INTEGRITY_STATES.CORRUPT
        : BLOB_INTEGRITY_STATES.ABSENT,
    );

    if (await this.#refetchFromCentral(hash)) {
      // Central held it after all, so the content was never at risk and the
      // local copy is now a verified replica rather than an outbox blob.
      await this.#models.Blob.update(
        { tier: BLOB_TIERS.CACHE, eligibleSinceTick: null },
        { where: { hash } },
      );
      // spec: FEC — now a cache copy, which this server does not cover.
      await this.#blobStore.discardParity(hash);
      log.warn('FacilityBlobHealer: repaired a faulty outbox blob from central', { hash, fault });
      return;
    }

    // Nothing left below error correction and a backup, neither of which this
    // server can do unattended. Surfaced for the integrity healthcheck to pick
    // up (see docs/runbooks/blob-integrity.md).
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
