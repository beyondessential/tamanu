import _config from 'config';
import { log } from '@tamanu/shared/services/logging';
import {
  FACT_CURRENT_SYNC_TICK,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
  FACT_LAST_SUCCESSFUL_SYNC_PUSH,
} from '@tamanu/constants/facts';
import {
  createSnapshotTable,
  dropAllSnapshotTables,
  dropSnapshotTable,
  getModelsForPush,
  getModelsForPull,
  saveIncomingChanges,
  waitForPendingEditsUsingSyncTick,
  withDeferredSyncSafeguards,
} from '@tamanu/database/sync';
import { attachChangelogToSnapshotRecords, pauseAudit } from '@tamanu/database/utils/audit';
import { Problem } from '@tamanu/errors';

import { pushOutgoingChanges } from './pushOutgoingChanges';
import { pullIncomingChanges, streamIncomingChanges } from './pullIncomingChanges';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';
import { assertIfPulledRecordsUpdatedAfterPushSnapshot } from './assertIfPulledRecordsUpdatedAfterPushSnapshot';
import { deleteRedundantLocalCopies } from './deleteRedundantLocalCopies';

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

  currentSyncPromise = null;

  nextSyncPromise = null;

  reason = null;

  lastDurationMs = 0;

  lastCompletedAt = 0;

  currentStartTime = 0;

  constructor({ models, sequelize, centralServer }) {
    this.models = models;
    this.sequelize = sequelize;
    this.centralServer = centralServer;
  }

  isSyncRunning() {
    return !!this.currentSyncPromise;
  }

  async waitForCurrentSyncAndTriggerNextSync() {
    await this.currentSyncPromise;
    return this.triggerSync();
  }

  async triggerSync(reason) {
    if (!this.constructor.config.sync.enabled) {
      log.warn('FacilitySyncManager.triggerSync: sync is disabled');
      return { enabled: false };
    }

    // if there is a currently running sync, and already another one
    // queued up to run after that, just wait for that next sync run
    // (which will definitely sync any changes made up until the time this sync was requested)
    if (this.nextSyncPromise) {
      const result = await this.nextSyncPromise;
      return { enabled: true, ...result };
    }

    // if there's an existing sync, just wait for that sync run and trigger the next one right after
    if (this.currentSyncPromise) {
      this.nextSyncPromise = this.waitForCurrentSyncAndTriggerNextSync();
      const result = await this.nextSyncPromise;
      return { enabled: true, ...result };
    }

    this.currentSyncPromise = null;
    this.nextSyncPromise = null;

    // set up a common sync promise to avoid double sync
    this.reason = reason;
    this.currentSyncPromise = this.runSync();

    // make sure sync promise gets cleared when finished, even if there's an error
    try {
      const result = await this.currentSyncPromise;
      return { enabled: true, ...result };
    } finally {
      this.currentSyncPromise = null;
      this.nextSyncPromise = null;
      this.reason = '';
      this.currentStartTime = 0;
    }
  }

  async runSync() {
    if (this.currentSyncPromise) {
      throw new Error(
        'It should not be possible to call "runSync" while an existing run is active',
      );
    }

    const startTime = new Date().getTime();
    this.currentStartTime = startTime;

    log.info('FacilitySyncManager.attemptStart', {
      reason: JSON.stringify(this.reason),
      startTime,
    });

    const pullSince = (await this.models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)) || -1;

    // the first step of sync is to start a session and retrieve the session id
    const {
      status,
      sessionId,
      startedAtTick: newSyncClockTime,
    } = await this.centralServer.startSyncSession({
      urgent: this.reason?.urgent,
      lastSyncedTick: pullSince,
    });

    if (!sessionId) {
      // we're queued
      log.info('FacilitySyncManager.wasQueued', { status });
      return { queued: true, ran: false };
    }

    log.info('FacilitySyncManager.startSession');

    // clear previous temp data, in case last session errored out or server was restarted
    await dropAllSnapshotTables(this.sequelize);

    log.info('FacilitySyncManager.receivedSessionInfo', {
      sessionId,
      startedAtTick: newSyncClockTime,
    });

    try {
      await this.pushChanges(sessionId, newSyncClockTime);

      await this.pullChanges(sessionId);
      await this.centralServer.endSyncSession(sessionId);
    } catch (error) {
      if (!(error instanceof Problem && error.response)) {
        // if the error is not a Problem or doesn't have a response, it occurred locally on the facility-server and we should notify the central server
        await this.centralServer.markSessionErrored(sessionId, error.message);
      }
      throw error;
    } finally {
      // clear temp data stored for persist
      await dropSnapshotTable(this.sequelize, sessionId);
    }

    const durationMs = Date.now() - startTime;
    log.info('FacilitySyncManager.completedSession', {
      durationMs,
    });
    this.lastDurationMs = durationMs;
    this.lastCompletedAt = new Date();

    return { queued: false, ran: true };
  }

  async pushChanges(sessionId, newSyncClockTime) {
    // get the sync tick we're up to locally, so that we can store it as the successful push cursor
    const currentSyncClockTime = await this.models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);

    // use the new unique sync tick for any changes from now on so that any records that are created
    // or updated even mid way through this sync, are marked using the new tick and will be captured
    // in the next push
    await this.models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, newSyncClockTime);
    log.debug('FacilitySyncManager.updatedLocalSyncClockTime', { newSyncClockTime });

    await waitForPendingEditsUsingSyncTick(this.sequelize, currentSyncClockTime);

    // syncing outgoing changes happens in two phases: taking a point-in-time copy of all records
    // to be pushed, and then pushing those up in batches
    // this avoids any of the records to be pushed being changed during the push period and
    // causing data that isn't internally coherent from ending up on the central server
    const pushSince = (await this.models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PUSH)) || -1;
    log.info('FacilitySyncManager.snapshottingOutgoingChanges', { pushSince });
    const modelsForPush = getModelsForPush(this.models);
    const outgoingChanges = await snapshotOutgoingChanges(this.sequelize, modelsForPush, pushSince);
    if (outgoingChanges.length > 0) {
      log.info('FacilitySyncManager.pushingOutgoingChanges', {
        totalPushing: outgoingChanges.length,
      });
      if (this.__testSpyEnabled) {
        this.__testOnlyPushChangesSpy.push({ sessionId, outgoingChanges });
      }
      const outgoingChangesWithChangelogs = await attachChangelogToSnapshotRecords(
        {
          models: this.models,
          sequelize: this.sequelize,
        },
        outgoingChanges,
        {
          minSourceTick: pushSince,
        },
      );
      await pushOutgoingChanges(this.centralServer, sessionId, outgoingChangesWithChangelogs);
      await deleteRedundantLocalCopies(modelsForPush, outgoingChanges);
    }

    await this.models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, currentSyncClockTime);
    log.debug('FacilitySyncManager.updatedLastSuccessfulPush', { currentSyncClockTime });
  }

  async pullChanges(sessionId) {
    // syncing incoming changes happens in two phases: pulling all the records from the server,
    // then saving all those records into the local database
    // this avoids a period of time where the the local database may be "partially synced"
    const pullSince = (await this.models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)) || -1;

    // pull incoming changes also returns the sync tick that the central server considers this
    // session to have synced up to
    await createSnapshotTable(this.sequelize, sessionId);
    const pull = (await this.centralServer.streaming())
      ? streamIncomingChanges
      : pullIncomingChanges;
    const { totalPulled, pullUntil } = await pull(
      this.centralServer,
      this.sequelize,
      sessionId,
      pullSince,
    );

    if (this.constructor.config.sync.assertIfPulledRecordsUpdatedAfterPushSnapshot) {
      await assertIfPulledRecordsUpdatedAfterPushSnapshot(
        Object.values(getModelsForPull(this.models)),
        sessionId,
      );
    }

    await this.sequelize.transaction(async () => {
      if (totalPulled > 0) {
        await pauseAudit(this.sequelize);
        log.info('FacilitySyncManager.savingChanges', { totalPulled });
        await withDeferredSyncSafeguards(this.sequelize, async () =>
          saveIncomingChanges(this.sequelize, getModelsForPull(this.models), sessionId),
        );
      }

      // update the last successful sync in the same save transaction - if updating the cursor fails,
      // we want to roll back the rest of the saves so that we don't end up detecting them as
      // needing a sync up to the central server when we attempt to resync from the same old cursor
      log.debug('FacilitySyncManager.updatingLastSuccessfulSyncPull', { pullUntil });
      await this.models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, pullUntil);
    });
  }
}
