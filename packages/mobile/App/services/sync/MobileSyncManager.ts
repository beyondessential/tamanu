import mitt from 'mitt';

import { Database } from '../../infra/db';
import { MODELS_MAP } from '../../models/modelsMap';
import { CentralServerConnection } from './CentralServerConnection';
import {
  clearPersistedSyncSessionRecords,
  getModelsForDirection,
  getSyncTick,
  pullIncomingChanges,
  pushOutgoingChanges,
  saveIncomingChanges,
  setSyncTick,
  snapshotOutgoingChanges,
} from './utils';
import { SYNC_DIRECTIONS } from '../../models/types';
import { SYNC_EVENT_ACTIONS } from './types';
import { CURRENT_SYNC_TIME, LAST_SUCCESSFUL_PULL, LAST_SUCCESSFUL_PUSH } from './constants';
import { SETTING_KEYS } from '~/constants/settings';

// Mobile sync timing utilities
const createTimingLogger = (operation: string, sessionId: string, customStartTime: number = null) => {
  const startTime = customStartTime || Date.now();
  const actions = [];
  let lastActionTime = startTime;

  return {
    logAction: (actionName: string, additionalData = {}) => {
      const now = Date.now();
      const durationMs = now - lastActionTime;
      
      actions.push({
        name: actionName,
        durationMs,
        ...additionalData,
      });
      
      lastActionTime = now;
    },

    getBenchmarkData: () => ({
      operation,
      sessionId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      totalDurationMs: Date.now() - startTime,
      actions,
    }),
  };
};

const createMobileSyncSessionAggregator = (sessionId: string) => {
  const sessionStartTime = Date.now();
  const operations = new Map();

  return {
    createOperationTimer: (operationName: string, customStartTime: number = null) => {
      const timing = createTimingLogger(operationName, sessionId, customStartTime);
      
      // Store operation for later aggregation
      operations.set(operationName, {
        operationName,
        startTime: customStartTime || Date.now(),
        timing,
      });
      
      return timing;
    },

    async finalizeSession() {
      const sessionEndTime = Date.now();
      const sessionTotalDuration = sessionEndTime - sessionStartTime;

      // Collect all operation benchmarks
      const operationBenchmarks = [];
      for (const [operationName, operationData] of operations.entries()) {
        const benchmarkData = operationData.timing.getBenchmarkData();
        operationBenchmarks.push({
          name: operationName,
          startTime: benchmarkData.startTime,
          endTime: benchmarkData.endTime,
          totalDurationMs: benchmarkData.totalDurationMs,
          actions: benchmarkData.actions,
        });
      }

      // Create final session benchmark
      const sessionBenchmark = {
        sessionId,
        totalDurationMs: sessionTotalDuration,
        startTime: new Date(sessionStartTime).toISOString(),
        endTime: new Date(sessionEndTime).toISOString(),
        operations: operationBenchmarks,
      };

      // Save to mobile database
      try {
        const { SyncBenchmark } = Database.models;
        const benchmark = SyncBenchmark.createWithData(sessionId, sessionBenchmark);
        await benchmark.save();
        console.log(`Mobile sync benchmark saved for session ${sessionId}: ${sessionTotalDuration}ms total`);
      } catch (error) {
        console.error('Failed to save mobile sync benchmark:', error);
      }

      return sessionBenchmark;
    },
  };
};

/**
 * Maximum progress that each stage contributes to the overall progress
 */
const STAGE_MAX_PROGRESS = {
  1: 33,
  2: 66,
  3: 100,
};

type SyncOptions = {
  urgent: boolean;
};

export const SYNC_STAGES_TOTAL = Object.values(STAGE_MAX_PROGRESS).length;

export class MobileSyncManager {
  isQueuing = false;

  isSyncing = false;

  progress = 0;

  progressMessage = '';

  syncStage = null;

  lastSuccessfulSyncTime = null;

  lastSyncPushedRecordsCount: number = null;

  lastSyncPulledRecordsCount: number = null;

  emitter = mitt();

  urgentSyncInterval = null;

  models: typeof MODELS_MAP;
  centralServer: CentralServerConnection;
  
  // Session timing aggregator
  private sessionAggregator = null;

  constructor(centralServer: CentralServerConnection) {
    this.centralServer = centralServer;
    this.models = Database.models;
  }

  setSyncStage(syncStage: number): void {
    this.syncStage = syncStage;
    this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_STATE_CHANGED);
  }

  /**
   * Set the current progress (%) and the current progress message for the circular progress bar
   * @param progress
   * @param progressMessage
   */
  setProgress(progress: number, progressMessage: string): void {
    this.progress = progress;
    this.progressMessage = progressMessage;
    this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_STATE_CHANGED);
  }

  /**
   * Calculate the current progress (%) using the final total and the current records in progress
   * @param total
   * @param progress
   * @param progressMessage
   */
  updateProgress = (total: number, progress: number, progressMessage: string): void => {
    // Get previous stage max progress
    const previousProgress = STAGE_MAX_PROGRESS[this.syncStage - 1] || 0;
    // Calculate the total progress of the current stage
    const progressDenominator = STAGE_MAX_PROGRESS[this.syncStage] - previousProgress;
    // Calculate the progress percentage of the current stage
    // (ie: out of stage 2 which is 33% of the overall progress)
    const currentStagePercentage = Math.min(
      Math.ceil((progress / total) * progressDenominator),
      progressDenominator,
    );
    // Add the finished stage progress to get the overall progress percentage
    const progressPercentage = previousProgress + currentStagePercentage;
    this.setProgress(progressPercentage, progressMessage);
  };

  /**
   * Wait for the current sync to end
   * @returns
   */
  async waitForCurrentSyncToEnd(): Promise<void> {
    if (this.isSyncing) {
      return new Promise((resolve) => {
        const done = (): void => {
          resolve();
          this.emitter.off(SYNC_EVENT_ACTIONS.SYNC_ENDED, done);
        };
        this.emitter.on(SYNC_EVENT_ACTIONS.SYNC_ENDED, done);
      });
    }

    return Promise.resolve();
  }

  /**
   * Trigger urgent sync, and along with urgent sync, schedule regular sync requests
   * to continuously connect to central server and request for status change of the sync session
   */
  async triggerUrgentSync(): Promise<void> {
    if (this.urgentSyncInterval) {
      console.warn('MobileSyncManager.triggerSync(): Urgent sync already started');
      return;
    }

    const urgentSyncIntervalInSecondsStr =
      (await this.models.Setting.getByKey(SETTING_KEYS.SYNC_URGENT_INTERVAL_IN_SECONDS)) || 10; // default 10 seconds interval

    const urgentSyncIntervalInSeconds = parseInt(urgentSyncIntervalInSecondsStr, 10);

    // Schedule regular urgent sync
    this.urgentSyncInterval = setInterval(
      () => this.triggerSync({ urgent: true }),
      urgentSyncIntervalInSeconds * 1000,
    );

    // start the sync now
    await this.triggerSync({ urgent: true });
  }

  /**
   * Trigger syncing and send through the sync errors if there is any
   * @returns
   */
  async triggerSync({ urgent }: SyncOptions = { urgent: false }): Promise<void> {
    if (this.isSyncing) {
      console.warn(
        'MobileSyncManager.triggerSync(): Tried to start syncing while sync in progress',
      );
      return;
    }

    const startTime = Date.now();

    try {
      await this.runSync({ urgent });
    } catch (error) {
      this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_ERROR, { error });
    } finally {
      // Reset all the values to default only if sync actually started, otherwise they should still be default values
      if (this.isSyncing) {
        this.syncStage = null;
        this.isSyncing = false;
        this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_STATE_CHANGED);
        this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_ENDED, `time=${Date.now() - startTime}ms`);
        if (this.urgentSyncInterval) {
          clearInterval(this.urgentSyncInterval);
          this.urgentSyncInterval = null;
        }
        console.log(`Sync took ${Date.now() - startTime} ms`);
      }
    }
  }

  async runSync({ urgent }: SyncOptions = { urgent: false }): Promise<void> {
    if (this.isSyncing) {
      throw new Error('MobileSyncManager.runSync(): Tried to start syncing while sync in progress');
    }

    console.log('MobileSyncManager.runSync(): Began sync run');

    this.isSyncing = true;

    // clear persisted cache from last session
    await clearPersistedSyncSessionRecords();

    const pullSince = await getSyncTick(this.models, LAST_SUCCESSFUL_PULL);

    // Create timing for session start
    const sessionStartTiming = createTimingLogger('Start Sync Session', 'temp-session');
    
    // the first step of sync is to start a session and retrieve the session id
    const {
      sessionId,
      startedAtTick: newSyncClockTime,
      status,
    } = await this.centralServer.startSyncSession({
      urgent,
      lastSyncedTick: pullSince,
    }, sessionStartTiming);

    if (!sessionId) {
      console.log(`MobileSyncManager.runSync(): Sync queue status: ${status}`);
      this.isSyncing = false;
      this.isQueuing = true;
      this.progressMessage = urgent ? 'Sync in progress...' : 'Sync in queue';
      this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_IN_QUEUE);
      return;
    }

    this.isSyncing = true;
    this.isQueuing = false;

    // Initialize session timing aggregator
    this.sessionAggregator = createMobileSyncSessionAggregator(sessionId);

    this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_STARTED);

    console.log('MobileSyncManager.runSync(): Sync started');

    await this.syncOutgoingChanges(sessionId, newSyncClockTime);
    await this.syncIncomingChanges(sessionId);

    await this.centralServer.endSyncSession(sessionId);

    // Finalize and save session benchmark
    if (this.sessionAggregator) {
      await this.sessionAggregator.finalizeSession();
      this.sessionAggregator = null;
    }

    // clear persisted cache from last session
    await clearPersistedSyncSessionRecords();

    this.lastSuccessfulSyncTime = new Date();
    this.setProgress(0, '');
  }

  /**
   * Syncing outgoing changes in batches
   * @param sessionId
   */
  async syncOutgoingChanges(sessionId: string, newSyncClockTime: number): Promise<void> {
    this.setSyncStage(1);

    // Create timing for this operation
    const timing = this.sessionAggregator?.createOperationTimer('Sync Outgoing Changes');
    timing?.logAction('setSyncStage', { stage: 1 });

    // get the sync tick we're up to locally, so that we can store it as the successful push cursor
    const currentSyncTick = await getSyncTick(this.models, CURRENT_SYNC_TIME);
    timing?.logAction('getCurrentSyncTick', { currentSyncTick });

    // use the new unique tick for any changes from now on so that any records that are created or
    // updated even mid way through this sync, are marked using the new tick and will be captured in
    // the next push
    await setSyncTick(this.models, CURRENT_SYNC_TIME, newSyncClockTime);
    timing?.logAction('setNewSyncTick', { newSyncClockTime });

    const pushSince = await getSyncTick(this.models, LAST_SUCCESSFUL_PUSH);
    timing?.logAction('getPushSince', { pushSince });
    
    console.log(
      `MobileSyncManager.syncOutgoingChanges(): Begin syncing outgoing changes since ${pushSince}`,
    );

    const modelsToPush = getModelsForDirection(this.models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL);
    timing?.logAction('getModelsToPush', { modelCount: Object.keys(modelsToPush).length });

    const outgoingChanges = await snapshotOutgoingChanges(modelsToPush, pushSince);
    timing?.logAction('snapshotOutgoingChanges', { changesCount: outgoingChanges.length });

    console.log(
      `MobileSyncManager.syncOutgoingChanges(): Finished snapshot ${outgoingChanges.length} outgoing changes`,
    );

    if (outgoingChanges.length > 0) {
      await pushOutgoingChanges(
        this.centralServer,
        modelsToPush,
        sessionId,
        outgoingChanges,
        (total, pushedRecords) =>
          this.updateProgress(total, pushedRecords, 'Pushing all new changes...'),
        timing,
      );
      timing?.logAction('pushOutgoingChanges', { 
        changesCount: outgoingChanges.length,
        successful: true 
      });
    } else {
      timing?.logAction('pushOutgoingChanges', { 
        changesCount: 0,
        skipped: true 
      });
    }

    this.lastSyncPushedRecordsCount = outgoingChanges.length;

    await setSyncTick(this.models, LAST_SUCCESSFUL_PUSH, currentSyncTick);
    timing?.logAction('updateLastSuccessfulPush', { currentSyncTick });

    console.log(
      `MobileSyncManager.syncOutgoingChanges(): End sync outgoing changes, outgoing changes count: ${outgoingChanges.length}`,
    );
  }

  /**
   * Syncing incoming changes happens in two phases:
   * pulling all the records from the server (in batches),
   * then saving all those records into the local database
   * this avoids a period of time where the the local database may be "partially synced"
   * @param sessionId
   */
  async syncIncomingChanges(sessionId: string): Promise<void> {
    this.setSyncStage(2);

    // Create timing for this operation
    const timing = this.sessionAggregator?.createOperationTimer('Sync Incoming Changes');
    timing?.logAction('setSyncStage', { stage: 2 });

    const pullSince = await getSyncTick(this.models, LAST_SUCCESSFUL_PULL);
    timing?.logAction('getPullSince', { pullSince });
    
    console.log(
      `MobileSyncManager.syncIncomingChanges(): Begin sync incoming changes since ${pullSince}`,
    );

    // This is the start of stage 2 which is calling pull/initiate.
    // At this stage, we don't really know how long it will take.
    // So only showing a message to indicate this this is still in progress
    this.setProgress(
      STAGE_MAX_PROGRESS[this.syncStage - 1],
      'Pausing at 33% while server prepares for pull, please wait...',
    );
    timing?.logAction('setInitialProgress', { progress: STAGE_MAX_PROGRESS[this.syncStage - 1] });

    const tablesForFullResync = await this.models.LocalSystemFact.findOne({
      where: { key: 'tablesForFullResync' },
    });
    timing?.logAction('checkTablesForFullResync', { 
      hasTablesForFullResync: !!tablesForFullResync,
      tables: tablesForFullResync?.value 
    });

    const incomingModels = getModelsForDirection(this.models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);
    timing?.logAction('getIncomingModels', { modelCount: Object.keys(incomingModels).length });

    const { totalPulled, pullUntil } = await pullIncomingChanges(
      this.centralServer,
      sessionId,
      pullSince,
      Object.values(incomingModels).map((m) => m.getTableName()),
      tablesForFullResync?.value.split(','),
      (total, downloadedChangesTotal) =>
        this.updateProgress(total, downloadedChangesTotal, 'Pulling all new changes...'),
      timing,
    );
    timing?.logAction('pullIncomingChanges', { totalPulled, pullUntil });

    console.log(`MobileSyncManager.syncIncomingChanges(): Saving ${totalPulled} changes`);

    this.setSyncStage(3);
    timing?.logAction('setSyncStage', { stage: 3 });

    // Save all incoming changes in 1 transaction so that the whole sync session save
    // either fail 100% or succeed 100%, no partial save.
    await Database.client.transaction(async () => {
      if (totalPulled > 0) {
        await saveIncomingChanges(sessionId, totalPulled, incomingModels, this.updateProgress, timing);
      }

      if (tablesForFullResync) {
        await tablesForFullResync.remove();
      }

      // update the last successful sync in the same save transaction,
      // if updating the cursor fails, we want to roll back the rest of the saves
      // so that we don't end up detecting them as needing a sync up
      // to the central server when we attempt to resync from the same old cursor
      await setSyncTick(this.models, LAST_SUCCESSFUL_PULL, pullUntil);
    });
    timing?.logAction('saveIncomingChanges', { 
      totalPulled,
      savedSuccessfully: true,
      clearedFullResyncTables: !!tablesForFullResync 
    });

    this.lastSyncPulledRecordsCount = totalPulled;

    console.log(
      `MobileSyncManager.syncIncomingChanges(): End sync incoming changes, incoming changes count: ${totalPulled}`,
    );
  }
}
