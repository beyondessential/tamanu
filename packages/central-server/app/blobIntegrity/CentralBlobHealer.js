import { BLOB_FAULTS } from '@tamanu/database/blobStore';
import { BLOB_INTEGRITY_STATES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

// spec: SCRUB
// Every copy central holds is authoritative, so a fault is recorded corrupt and escalated. Repair
// comes from a facility offering the hash, or from a backup.
export class CentralBlobHealer {
  #blobStore;
  #models;

  constructor({ blobStore, models }) {
    this.#blobStore = blobStore;
    this.#models = models;
  }

  async heal({ hash, fault, blob }) {
    // spec: AV
    const knownBad = Boolean(await this.#models.BlobQuarantine.findOne({ where: { hash } }));

    // spec: FEC
    if (!knownBad && fault === BLOB_FAULTS.CORRUPT && (await this.#blobStore.repairFromParity(hash))) {
      log.info('CentralBlobHealer: repaired a corrupt blob from its parity', { hash });
      return;
    }

    if (!blob) {
      // No row to stamp: registering it absent puts the fault where monitoring can see it.
      await this.#blobStore.recordAbsentReference(hash);
    } else {
      await this.#blobStore.recordIntegrityState(
        hash,
        fault === BLOB_FAULTS.CORRUPT
          ? BLOB_INTEGRITY_STATES.CORRUPT
          : BLOB_INTEGRITY_STATES.ABSENT,
      );
    }
    log.error('CentralBlobHealer: authoritative blob failed verification and needs repair', {
      hash,
      fault,
    });
  }
}
