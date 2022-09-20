import config from 'config';

import { log } from 'shared/services/logging';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';

import { setSyncClockTime } from './setSyncClockTime';
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

    // the first step of sync is to start a session and retrieve the id and current global sync time
    const { sessionId, syncClockTick } = await this.centralServer.startSyncSession();

    // persist the current global clock time through to the facility's copy of the sync time now
    // so that any records that are created or updated from this point on, even mid way through this
    // sync, are marked using the new tick and will be captured in the next sync
    await setSyncClockTime(this.sequelize, syncClockTick);

    // syncing outgoing changes happens in two phases: taking a point-in-time copy of all records
    // to be pushed, and then pushing those up in batches
    // this avoids any of the records to be pushed being changed during the push period and
    // causing data that isn't internally coherent from ending up on the sync server
    const since = (await this.models.LocalSystemFact.get('LastSuccessfulSyncTime')) || 0;
    const outgoingChanges = await snapshotOutgoingChanges(
      getModelsForDirection(this.models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL),
      since,
    );
    if (outgoingChanges.length > 0) {
      await pushOutgoingChanges(this.centralServer, sessionId, outgoingChanges);
    }

    // syncing incoming changes happens in two phases: pulling all the records from the server,
    // then saving all those records into the local database
    // this avoids a period of time where the the local database may be "partially synced"
    const incomingChanges = await pullIncomingChanges(this.centralServer, sessionId, since);
    await this.sequelize.transaction(async () => {
      if (incomingChanges.length > 0) {
        await saveIncomingChanges(
          this.sequelize,
          getModelsForDirection(this.models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
          incomingChanges,
        );
      }

      // update the last successful sync in the same save transaction - if updating the cursor fails,
      // we want to roll back the rest of the saves so that we don't end up detecting them as
      // needing a sync up to the central server when we attempt to resync from the same old cursor
      await this.models.LocalSystemFact.set('LastSuccessfulSyncTime', syncClockTick);
    });
    await this.centralServer.endSyncSession(sessionId);

    const elapsedTimeMs = Date.now() - startTimestampMs;
    log.info(`FacilitySyncManager.runSync: finished sync run in ${elapsedTimeMs}ms`);

    this.syncPromise = null;
  }
}
