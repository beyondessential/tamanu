import config from 'config';

import { log } from 'shared/services/logging';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { CURRENT_SYNC_TIME_KEY } from 'shared/sync/constants';
import { getModelsForDirection, saveIncomingChanges } from 'shared/sync';

import { pushOutgoingChanges } from './pushOutgoingChanges';
import { pullIncomingChanges } from './pullIncomingChanges';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';

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

    // if there's an existing sync, just wait for that sync run
    if (this.syncPromise) {
      await this.syncPromise;
      return;
    }

    // set up a common sync promise to avoid double sync
    this.syncPromise = this.runSync();

    // make sure sync promise gets cleared when finished, even if there's an error
    try {
      await this.syncPromise;
    } finally {
      this.syncPromise = null;
    }
  }

  async runSync() {
    if (this.syncPromise) {
      throw new Error(
        'It should not be possible to call "runSync" while an existing run is active',
      );
    }

    // clear previous temp data stored for persist
    await this.models.SyncSessionRecord.truncate({ cascade: true, force: true });
    await this.models.SyncSession.truncate({ cascade: true, force: true });

    const startTime = new Date();
    log.info(`FacilitySyncManager.runSync: began sync run`);

    // the first step of sync is to start a session and retrieve the session id
    const sessionId = await this.centralServer.startSyncSession();

    // ~~~ Push phase ~~~ //

    // get the sync tick we're up to locally, so that we can store it as the successful push cursor
    const currentSyncClockTime = await this.models.LocalSystemFact.get(CURRENT_SYNC_TIME_KEY);

    // tick the global sync clock, and use that new unique tick for any changes from now on so that
    // any records that are created or updated even mid way through this sync, are marked using the
    // new tick and will be captured in the push
    const newSyncClockTime = await this.centralServer.tickGlobalClock();
    await this.models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, newSyncClockTime);
    log.debug(`FacilitySyncManager.runSync: Local sync clock time set to ${newSyncClockTime}`);

    // syncing outgoing changes happens in two phases: taking a point-in-time copy of all records
    // to be pushed, and then pushing those up in batches
    // this avoids any of the records to be pushed being changed during the push period and
    // causing data that isn't internally coherent from ending up on the sync server
    const pushSince = (await this.models.LocalSystemFact.get('lastSuccessfulSyncPush')) || -1;
    const outgoingChanges = await snapshotOutgoingChanges(
      getModelsForDirection(this.models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL),
      sessionId,
      pushSince,
    );
    if (outgoingChanges.length > 0) {
      log.debug(
        `FacilitySyncManager.runSync: Pushing a total of ${outgoingChanges.length} changes`,
      );
      await pushOutgoingChanges(this.centralServer, sessionId, outgoingChanges);
    }
    log.debug(
      `FacilitySyncManager.runSync: Setting the last successful sync push time to ${currentSyncClockTime}`,
    );
    await this.models.LocalSystemFact.set('lastSuccessfulSyncPush', currentSyncClockTime);

    // ~~~ Pull phase ~~~ //

    // tick the global sync clock, and use that as our saved checkpoint for where we've pulled to,
    // if this pull is successful (important to use a higher unique sync tick than our push tick)
    // as otherwise we'll end up pulling the same records we just pushed the _next_ time we pull,
    // given they get saved on the central server using the update tick at the moment they are
    // persisted
    const pullTick = await this.centralServer.tickGlobalClock();

    // syncing incoming changes happens in two phases: pulling all the records from the server,
    // then saving all those records into the local database
    // this avoids a period of time where the the local database may be "partially synced"
    const pullSince = (await this.models.LocalSystemFact.get('lastSuccessfulSyncPull')) || -1;
    await this.models.SyncSession.create({
      id: sessionId,
      startTime,
      lastConnectionTime: startTime,
    });
    const incomingChangesCount = await pullIncomingChanges(
      this.centralServer,
      this.models,
      sessionId,
      pullSince,
    );
    // save last successful sync pull cursor, so that we can avoid pulling our own pushed records
    // again next sync
    await this.sequelize.transaction(async () => {
      if (incomingChangesCount > 0) {
        log.debug(
          `FacilitySyncManager.runSync: Saving a total of ${incomingChangesCount.length} changes`,
        );
        await saveIncomingChanges(
          this.models,
          getModelsForDirection(this.models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
          sessionId,
        );
      }

      // update the last successful sync in the same save transaction - if updating the cursor fails,
      // we want to roll back the rest of the saves so that we don't end up detecting them as
      // needing a sync up to the central server when we attempt to resync from the same old cursor
      log.debug(
        `FacilitySyncManager.runSync: Setting the last successful sync pull time to ${pullTick}`,
      );
      await this.models.LocalSystemFact.set('lastSuccessfulSyncPull', pullTick);
    });
    await this.centralServer.endSyncSession(sessionId);

    const elapsedTimeMs = Date.now() - startTime.getTime();
    log.info(`FacilitySyncManager.runSync: finished sync run in ${elapsedTimeMs}ms`);

    // clear temp data stored for persist
    await this.models.SyncSessionRecord.truncate({ cascade: true, force: true });
    await this.models.SyncSession.truncate({ cascade: true, force: true });
  }
}
