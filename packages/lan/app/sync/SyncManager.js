import config from 'config';

import { log } from 'shared/services/logging';

import { pullIncomingChanges } from './pullIncomingChanges';
import { saveIncomingChanges } from './saveIncomingChanges';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';
import { pushOutgoingChanges } from './pushOutgoingChanges';

export class SyncManager {
  models = null;

  remote = null;

  syncPromise = null;

  constructor({ models, remote }) {
    this.models = models;
    this.remote = remote;
  }

  async triggerSync() {
    if (!config.sync.enabled) {
      log.warn('SyncManager.triggerSync: sync is disabled');
      return;
    }

    // if there's no existing sync, kick one off
    if (!this.syncPromise) {
      this.syncPromise = this.runSync();
    }

    // wait for the sync run
    await this.syncPromise;
  }

  async runSync() {
    if (this.syncPromise) {
      throw new Error(
        'It should not be possible to call "runSync" while an existing run is active',
      );
    }

    const startTimestampMs = Date.now();
    log.info(`SyncManager.runSync: began sync run`);

    // syncing outgoing changes happens in two phases: taking a point-in-time copy of all records
    // to be pushed, and then pushing those up in batches
    // this avoids any of the records to be pushed being changed during the push period and
    // causing data that isn't internally coherent from ending up on the sync server
    const [outgoingCursor, setOutgoingCursor] = await this.models.SyncCursor.useOutgoingCursor();
    const outgoingChanges = await snapshotOutgoingChanges(this.models, outgoingCursor);
    await pushOutgoingChanges(this.remote, outgoingChanges, setOutgoingCursor);

    // syncing incoming changes happens in two phases: pulling all the records from the server,
    // then saving all those records into the local database
    // this avoids a period of time where the the local database may be "partially synced"
    const [incomingCursor, setIncomingCursor] = await this.models.SyncCursor.useIncomingCursor();
    const incomingChanges = await pullIncomingChanges(this.remote, incomingCursor);
    await saveIncomingChanges(this.models, incomingChanges, setIncomingCursor);

    const elapsedTimeMs = Date.now() - startTimestampMs;
    log.info(`SyncManager.runSync: finished sync run in ${elapsedTimeMs}ms`);
  }

  // pull all of a patient's existing data, and mark them to be kept up to date from now on
  // this can happen in parallel with the normal sync process as it doesn't interfere
  async syncPatient(patientId) {
    const changes = await pullIncomingChanges(this.remote, 0, patientId);
    await saveIncomingChanges(this.models, changes, () => {});

    // tell the sync server to keep patient up to date in this facility
    // this is done last so that we know the full patient sync is complete before adding them
    // to any regular sync (which otherwise might run simultaneously)
    await this.remote.markPatientForSync(patientId);
  }
}
