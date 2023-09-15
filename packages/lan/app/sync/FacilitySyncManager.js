// TODO: use db fetcher config
import _config from 'config';
import { log } from 'shared/services/logging';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { CURRENT_SYNC_TIME_KEY } from '@tamanu/shared/sync/constants';
import {
  createSnapshotTable,
  dropSnapshotTable,
  dropAllSnapshotTables,
  getModelsForDirection,
  saveIncomingChanges,
  waitForPendingEditsUsingSyncTick,
} from 'shared/sync';

import { pushOutgoingChanges } from './pushOutgoingChanges';
import { pullIncomingChanges } from './pullIncomingChanges';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';

export class FacilitySyncManager {
  static config = _config;

  static overrideConfig(override) {
    this.config = override;
  }

  static restoreConfig() {
    this.config = _config;
  }

  // This is only used for jest tests. It is a workaround to spies not working
  // with importing modules in the way that this module is used. See the
  // FacilitySyncManager.test.js ('edge cases' suite) or SAV-249
  __testSpyEnabled = false;

  __testOnlyPushChangesSpy = [];

  models = null;

  sequelize = null;

  centralServer = null;

  syncPromise = null;

  reason = '';

  constructor({ models, sequelize, centralServer }) {
    this.models = models;
    this.sequelize = sequelize;
    this.centralServer = centralServer;
  }

  isSyncRunning() {
    return !!this.syncPromise;
  }

  async triggerSync(reason) {
    if (!this.constructor.config.sync.enabled) {
      log.warn('FacilitySyncManager.triggerSync: sync is disabled');
      return;
    }

    // if there's an existing sync, just wait for that sync run
    if (this.syncPromise) {
      await this.syncPromise;
      return;
    }

    // set up a common sync promise to avoid double sync
    this.reason = reason;
    this.syncPromise = this.runSync();

    // make sure sync promise gets cleared when finished, even if there's an error
    try {
      await this.syncPromise;
    } finally {
      this.syncPromise = null;
      this.reason = '';
    }
  }

  async runSync() {
    if (this.syncPromise) {
      throw new Error(
        'It should not be possible to call "runSync" while an existing run is active',
      );
    }

    log.info(`Sync: Initiating session`, { reason: this.reason });

    // clear previous temp data, in case last session errored out or server was restarted
    await dropAllSnapshotTables(this.sequelize);

    const startTime = new Date();

    // the first step of sync is to start a session and retrieve the session id
    const {
      sessionId,
      startedAtTick: newSyncClockTime,
    } = await this.centralServer.startSyncSession();

    log.info('Sync: Session started', {
      sessionId,
      startedAtTick: newSyncClockTime,
    });

    await this.pushChanges(sessionId, newSyncClockTime);
    await this.pullChanges(sessionId);

    await this.centralServer.endSyncSession(sessionId);

    const elapsedTimeMs = Date.now() - startTime.getTime();
    log.info(`FacilitySyncManager.runSync: finished sync run in ${elapsedTimeMs}ms`);

    // clear temp data stored for persist
    await dropSnapshotTable(this.sequelize, sessionId);
  }

  async pushChanges(sessionId, newSyncClockTime) {
    // get the sync tick we're up to locally, so that we can store it as the successful push cursor
    const currentSyncClockTime = await this.models.LocalSystemFact.get(CURRENT_SYNC_TIME_KEY);

    // use the new unique sync tick for any changes from now on so that any records that are created
    // or updated even mid way through this sync, are marked using the new tick and will be captured
    // in the next push
    await this.models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, newSyncClockTime);
    log.debug('Sync: Updated local sync clock time', { newSyncClockTime });

    await waitForPendingEditsUsingSyncTick(this.sequelize, currentSyncClockTime);

    // syncing outgoing changes happens in two phases: taking a point-in-time copy of all records
    // to be pushed, and then pushing those up in batches
    // this avoids any of the records to be pushed being changed during the push period and
    // causing data that isn't internally coherent from ending up on the sync server
    const pushSince = (await this.models.LocalSystemFact.get('lastSuccessfulSyncPush')) || -1;
    log.info('Sync: Snapshotting outgoing changes', { pushSince });
    const outgoingChanges = await snapshotOutgoingChanges(
      this.sequelize,
      getModelsForDirection(this.models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL),
      pushSince,
    );
    if (outgoingChanges.length > 0) {
      log.info('Sync: Pushing outgoing changes', { totalPushing: outgoingChanges.length });
      if (this.__testSpyEnabled) {
        this.__testOnlyPushChangesSpy.push({ sessionId, outgoingChanges });
      }
      await pushOutgoingChanges(this.centralServer, sessionId, outgoingChanges);
    }
    await this.models.LocalSystemFact.set('lastSuccessfulSyncPush', currentSyncClockTime);
    log.debug('Sync: Updated last successful push', { currentSyncClockTime });
  }

  async pullChanges(sessionId) {
    // syncing incoming changes happens in two phases: pulling all the records from the server,
    // then saving all those records into the local database
    // this avoids a period of time where the the local database may be "partially synced"
    const pullSince = (await this.models.LocalSystemFact.get('lastSuccessfulSyncPull')) || -1;

    // pull incoming changes also returns the sync tick that the central server considers this
    // session to have synced up to
    await createSnapshotTable(this.sequelize, sessionId);
    const { totalPulled, pullUntil } = await pullIncomingChanges(
      this.centralServer,
      this.sequelize,
      sessionId,
      pullSince,
    );

    await this.sequelize.transaction(async () => {
      if (totalPulled > 0) {
        log.info('Sync: Saving changes', { totalPulled });
        await saveIncomingChanges(
          this.sequelize,
          getModelsForDirection(this.models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
          sessionId,
        );
      }

      // update the last successful sync in the same save transaction - if updating the cursor fails,
      // we want to roll back the rest of the saves so that we don't end up detecting them as
      // needing a sync up to the central server when we attempt to resync from the same old cursor
      log.debug('Sync: Updating last successful sync pull', { pullUntil });
      await this.models.LocalSystemFact.set('lastSuccessfulSyncPull', pullUntil);
    });
  }
}
