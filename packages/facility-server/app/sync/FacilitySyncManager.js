import _config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { SYNC_PHASE_LABELS } from '@tamanu/constants';
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
  getModelsForPullPhase,
  saveIncomingChanges,
  waitForPendingEditsUsingSyncTick,
  withDeferredSyncSafeguards,
} from '@tamanu/database/sync';
import { attachChangelogToSnapshotRecords, pauseAudit } from '@tamanu/database/utils/audit';
import { Problem } from '@tamanu/errors';

import { getSyncConfig } from '../serverConfig';

import { pushOutgoingChanges } from './pushOutgoingChanges';
import { pullIncomingChanges, streamIncomingChanges } from './pullIncomingChanges';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';
import { assertIfPulledRecordsUpdatedAfterPushSnapshot } from './assertIfPulledRecordsUpdatedAfterPushSnapshot';
import { deleteRedundantLocalCopies } from './deleteRedundantLocalCopies';
import { pullSettingsPsk } from './pullSettingsPsk';
import { convergeSyncUser } from './convergeSyncUser';
import { completeInitialSyncPhase, getInitialSyncPhase } from './initialSyncPhase';

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

  // the run of the next initial sync phase, kicked off by the phase before it
  initialSyncContinuation = null;

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
    let result;
    try {
      result = await this.currentSyncPromise;
    } finally {
      this.currentSyncPromise = null;
      this.nextSyncPromise = null;
      this.reason = '';
      this.currentStartTime = 0;
    }

    if (result?.nextPhase) {
      this.continueInitialSync(result.nextPhase);
    }

    return { enabled: true, ...result };
  }

  async runSync() {
    if (this.currentSyncPromise) {
      throw new Error(
        'It should not be possible to call "runSync" while an existing run is active',
      );
    }

    const { email, password } = getSyncConfig();
    if (!email || !password) {
      throw new Error('Sync credentials are not configured');
    }

    const startTime = new Date().getTime();
    this.currentStartTime = startTime;

    log.info('FacilitySyncManager.attemptStart', {
      reason: JSON.stringify(this.reason),
      startTime,
    });

    const pullSince = (await this.models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)) ?? -1;

    // a facility that hasn't finished its first sync performs one phase of it per run, and reports
    // its position as never-synced until the last phase lands, which keeps its place at the front of
    // the sync queue
    const phase = await getInitialSyncPhase(this.models);
    if (phase) {
      log.info('FacilitySyncManager.startingInitialSyncPhase', { phase: SYNC_PHASE_LABELS[phase] });
    }

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

    let nextPhase = null;
    try {
      await this.pushChanges(sessionId, newSyncClockTime);

      nextPhase = await this.pullChanges(sessionId, phase);
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

    // Provisioning that needs a live central, ordered: the PSK read is served to a
    // dedicated sync user only, so the swap has to land first. Neither may fail the
    // sync it rode in on, and both retry on the next one.
    try {
      await convergeSyncUser({
        sequelize: this.sequelize,
        models: this.models,
        centralServer: this.centralServer,
      });
    } catch (error) {
      log.warn('FacilitySyncManager.convergeSyncUserFailed', { error: error.message });
    }

    try {
      await pullSettingsPsk({ models: this.models, centralServer: this.centralServer });
    } catch (error) {
      log.warn('FacilitySyncManager.pullSettingsPskFailed', { error: error.message });
    }

    const durationMs = Date.now() - startTime;
    log.info('FacilitySyncManager.completedSession', {
      durationMs,
      ...(phase && { phase: SYNC_PHASE_LABELS[phase] }),
    });
    this.lastDurationMs = durationMs;
    this.lastCompletedAt = new Date();

    return { queued: false, ran: true, nextPhase };
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

  // the next phase of an initial sync starts as soon as the phase before it lands, rather than
  // waiting for the next scheduled sync. If it fails to start, the scheduled sync picks up the same
  // phase, so this is not awaited and its failure is not the completed phase's problem
  continueInitialSync(phase) {
    log.info('FacilitySyncManager.continuingInitialSync', { phase: SYNC_PHASE_LABELS[phase] });
    this.initialSyncContinuation = this.triggerSync({ initialSyncPhase: phase }).catch(error => {
      log.warn('FacilitySyncManager.continueInitialSyncFailed', {
        phase: SYNC_PHASE_LABELS[phase],
        error: error.message,
      });
    });
  }

  // returns the phase of the initial sync to run next, or null if this was an ordinary sync or the
  // last phase of an initial one
  async pullChanges(sessionId, phase) {
    // syncing incoming changes happens in two stages: pulling all the records from the server,
    // then saving all those records into the local database
    // this avoids a period of time where the the local database may be "partially synced"
    const pullSince = (await this.models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)) ?? -1;

    // a phase pulls only its own tables, so central snapshots only those and the phase's snapshot
    // completes in proportion to its own data rather than the facility's whole share
    const modelsForPull = phase
      ? getModelsForPullPhase(this.models, phase)
      : getModelsForPull(this.models);
    const tablesToInclude = phase
      ? Object.values(modelsForPull).map(model => model.tableName)
      : undefined;

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
      tablesToInclude,
    );

    if (this.constructor.config.sync.assertIfPulledRecordsUpdatedAfterPushSnapshot) {
      await assertIfPulledRecordsUpdatedAfterPushSnapshot(Object.values(modelsForPull), sessionId);
    }

    return await this.sequelize.transaction(async () => {
      if (totalPulled > 0) {
        await pauseAudit(this.sequelize);
        log.info('FacilitySyncManager.savingChanges', { totalPulled });
        await withDeferredSyncSafeguards(this.sequelize, async () =>
          saveIncomingChanges(this.sequelize, modelsForPull, sessionId),
        );
      }

      // update the sync position in the same save transaction - if updating it fails, we want to roll
      // back the rest of the saves so that we don't end up detecting them as needing a sync up to the
      // central server when we attempt to resync from the same old cursor
      if (phase) {
        return await completeInitialSyncPhase(this.models, phase, pullUntil);
      }

      log.debug('FacilitySyncManager.updatingLastSuccessfulSyncPull', { pullUntil });
      await this.models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, pullUntil);
      return null;
    });
  }
}
