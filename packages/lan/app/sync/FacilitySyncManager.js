import config from 'config';

import { log } from 'shared/services/logging';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';

import { pushOutgoingChanges } from './pushOutgoingChanges';
import { pullIncomingChanges } from './pullIncomingChanges';

export class FacilitySyncManager {
  models = null;

  centralServer = null;

  syncPromise = null;

  constructor({ models, centralServer }) {
    this.models = models;
    this.centralServer = centralServer;
  }

  async triggerSync() {
    if (!config.sync.enabled) {
      log.warn('FacilitySyncManager.triggerSync: sync is disabled');
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
    log.info(`FacilitySyncManager.runSync: began sync run`);

    // syncing outgoing changes happens in two phases: taking a point-in-time copy of all records
    // to be pushed, and then pushing those up in batches
    // this avoids any of the records to be pushed being changed during the push period and
    // causing data that isn't internally coherent from ending up on the sync server
    const [outgoingCursor, setOutgoingCursor] = await this.models.SyncCursor.useOutgoingCursor();
    const outgoingChanges = await snapshotOutgoingChanges(
      getModelsForDirection(this.models, SYNC_DIRECTIONS.FACILITY_TO_CENTRAL),
      outgoingCursor,
    );
    await pushOutgoingChanges(this.centralServer, outgoingChanges);
    await setOutgoingCursor(outgoingChanges[outgoingChanges.length - 1].timestamp);

    // syncing incoming changes happens in two phases: pulling all the records from the server,
    // then saving all those records into the local database
    // this avoids a period of time where the the local database may be "partially synced"
    const [incomingCursor, setIncomingCursor] = await this.models.SyncCursor.useIncomingCursor();
    const incomingChanges = await pullIncomingChanges(this.centralServer, incomingCursor);
    await saveIncomingChanges(
      getModelsForDirection(this.models, SYNC_DIRECTIONS.CENTRAL_TO_FACILITY),
      incomingChanges,
    );
    await setIncomingCursor(incomingChanges[incomingChanges.length - 1].timestamp);

    const elapsedTimeMs = Date.now() - startTimestampMs;
    log.info(`FacilitySyncManager.runSync: finished sync run in ${elapsedTimeMs}ms`);
  }

  // pull all of a patient's existing data, and mark them to be kept up to date from now on
  // this can happen in parallel with the normal sync process as it doesn't interfere
  async syncPatient(patientId) {
    const changes = await pullIncomingChanges(this.centralServer, 0, patientId);
    await saveIncomingChanges({ patient: this.models.patient }, changes);

    // tell the sync server to keep patient up to date in this facility
    // this is done last so that we know the full patient sync is complete before adding them
    // to any regular sync (which otherwise might run simultaneously)
    await this.centralServer.markPatientForSync(patientId);
  }
}
