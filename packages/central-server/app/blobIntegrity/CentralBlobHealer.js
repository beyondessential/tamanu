import { BLOB_FAULTS } from '@tamanu/database/blobStore';
import { BLOB_INTEGRITY_STATES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

// spec: SCRUB
// Central's response to a blob that fails verification. Every copy central
// holds is authoritative, so there is no low-severity case here as there is on
// a facility: a fault is content the deployment may have lost. The copy is
// quarantined (retained, never served) and escalated, and repair comes either
// from a facility that still holds the content — opportunistically, as it
// connects and offers the hash, which the transfer routes handle — or from a
// backup, which is a human action the runbook covers.
export class CentralBlobHealer {
  #blobStore;

  constructor({ blobStore }) {
    this.#blobStore = blobStore;
  }

  async heal({ hash, fault, blob }) {
    if (!blob) {
      // The referential pass: a synchronised record references content the
      // registry does not name, so there is no row to stamp. Registering it
      // absent records the fault where the state model and its monitoring can
      // see it, instead of leaving it as a log line repeated every pass.
      await this.#blobStore.recordAbsentReference(hash);
    } else {
      await this.#blobStore.recordIntegrityState(
        hash,
        fault === BLOB_FAULTS.CORRUPT
          ? BLOB_INTEGRITY_STATES.QUARANTINED
          : BLOB_INTEGRITY_STATES.ABSENT,
      );
    }
    log.error('CentralBlobHealer: authoritative blob failed verification and needs repair', {
      hash,
      fault,
    });
  }
}
