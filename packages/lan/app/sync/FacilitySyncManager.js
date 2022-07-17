import config from 'config';

import { log } from 'shared/services/logging';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';

import { saveCurrentSyncIndex } from './saveCurrentSyncIndex';
import { pushOutgoingChanges } from './pushOutgoingChanges';
import { pullIncomingChanges } from './pullIncomingChanges';

export class FacilitySyncManager {
  models = null;

  sequelize = null;

  centralServer = null;

  syncPromise = null;

  constructor({ models, sequelize, centralServer }) {
    this.models = models;
    this.sequelize = sequelize;
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

    // the first step of sync is to start a session and retrieve the index used as both the id of
    // the session, and a point in time marker on the global sync timeline.
    // we persist this now as our current sync index, so that any records that are created or updated
    // from this point on are marked using that and will be captured in the next sync (avoiding any
    // missed changes due to a race condition)
    const sessionIndex = await this.centralServer.startSyncSession();
    await saveCurrentSyncIndex(this.sequelize, sessionIndex);

    // syncing outgoing changes happens in two phases: taking a point-in-time copy of all records
    // to be pushed, and then pushing those up in batches
    // this avoids any of the records to be pushed being changed during the push period and
    // causing data that isn't internally coherent from ending up on the sync server
    const cursor = (await this.models.Setting.get('SyncCursor')) || 0;
    const outgoingChanges = await snapshotOutgoingChanges(
      getModelsForDirection(this.models, SYNC_DIRECTIONS.FACILITY_TO_CENTRAL),
      cursor,
    );
    if (outgoingChanges.length > 0) {
      await pushOutgoingChanges(this.centralServer, sessionIndex, outgoingChanges);
    }

    // syncing incoming changes happens in two phases: pulling all the records from the server,
    // then saving all those records into the local database
    // this avoids a period of time where the the local database may be "partially synced"
    const incomingChanges = await pullIncomingChanges(this.centralServer, sessionIndex, cursor);
    if (incomingChanges.length > 0) {
      await saveIncomingChanges(
        this.sequelize,
        getModelsForDirection(this.models, SYNC_DIRECTIONS.CENTRAL_TO_FACILITY),
        incomingChanges,
      );
    }

    await this.models.Setting.set('SyncCursor', sessionIndex);
    await this.centralServer.endSyncSession(sessionIndex);

    const elapsedTimeMs = Date.now() - startTimestampMs;
    log.info(`FacilitySyncManager.runSync: finished sync run in ${elapsedTimeMs}ms`);
  }

  // pull all of a patient's existing data, and mark them to be kept up to date from now on
  // this can happen in parallel with the normal sync process as it doesn't interfere
  async syncPatient(patientId) {
    const sessionIndex = await this.centralServer.startSyncSession();
    const changes = await pullIncomingChanges(this.centralServer, sessionIndex, 0, patientId);
    await saveIncomingChanges({ patient: this.models.patient }, changes);

    // tell the sync server to keep patient up to date in this facility
    // this is done last so that we know the full patient sync is complete before adding them
    // to any regular sync (which otherwise might run simultaneously)
    await this.centralServer.markPatientForSync(patientId);

    await this.centralServer.endSyncSession(sessionIndex);
  }
}
