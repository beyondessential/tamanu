import mitt from 'mitt';

import { Database } from '../../infra/db';
import { MODELS_MAP } from '../../models/modelsMap';
import { CentralServerConnection } from './CentralServerConnection';
import {
  snapshotOutgoingChanges,
  pushOutgoingChanges,
  pullIncomingChanges,
  saveIncomingChanges,
  getModelsForDirection,
  getSyncTick,
  setSyncTick,
  clearPersistedSyncSessionRecords,
} from './utils';
import { SYNC_DIRECTIONS } from '../../models/types';
import { SYNC_EVENT_ACTIONS } from './types';
import { formatDate } from '../../ui/helpers/date';
import { DateFormats } from '../../ui/helpers/constants';
import { CURRENT_SYNC_TIME, LAST_SUCCESSFUL_PULL, LAST_SUCCESSFUL_PUSH } from './constants';

/**
 * Maximum progress that each stage contributes to the overall progress
 */
const STAGE_MAX_PROGRESS = {
  1: 33,
  2: 66,
  3: 100,
};

export const SYNC_STAGES_TOTAL = Object.values(STAGE_MAX_PROGRESS).length;

export class MobileSyncManager {
  isSyncing = false;

  progress = 0;

  progressMessage = '';

  syncStage = null;

  lastSuccessfulSyncTick = '';

  lastSyncPushedRecordsCount: number = null;

  lastSyncPulledRecordsCount: number = null;

  emitter = mitt();

  models: typeof MODELS_MAP;
  centralServer: CentralServerConnection;

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
      return new Promise(resolve => {
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
   * Trigger syncing and send through the sync errors if there is any
   * @returns
   */
  async triggerSync(): Promise<void> {
    if (this.isSyncing) {
      console.warn(
        'MobileSyncManager.triggerSync(): Tried to start syncing while sync in progress',
      );
      return;
    }

    const startTime = Date.now();

    try {
      await this.runSync();
      this.lastSuccessfulSyncTick = formatDate(new Date(), DateFormats.DATE_AND_TIME);
      this.setProgress(0, '');
    } catch (error) {
      this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_ERROR, { error });
    } finally {
      this.syncStage = null;
      this.isSyncing = false;
      this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_STATE_CHANGED);
      this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_ENDED, `time=${Date.now() - startTime}ms`);
      console.log(`Sync took ${Date.now() - startTime} ms`);
    }
  }

  async runSync(): Promise<void> {
    if (this.isSyncing) {
      throw new Error('MobileSyncManager.runSync(): Tried to start syncing while sync in progress');
    }

    console.log('MobileSyncManager.runSync(): Began sync run');

    this.isSyncing = true;

    // clear persisted cache from last session
    await clearPersistedSyncSessionRecords();

    const pullSince = await getSyncTick(this.models, LAST_SUCCESSFUL_PULL);

    // the first step of sync is to start a session and retrieve the session id
    const {
      sessionId,
      startedAtTick: newSyncClockTime,
      status,
    } = await this.centralServer.startSyncSession({
      urgent: false,
      lastSyncedTick: pullSince,
    });

    if (!sessionId) {
      console.log(`MobileSyncManager.runSync(): Sync queue status: ${status}`);
      this.isSyncing = false;
      return;
    }

    this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_STARTED);

    console.log('MobileSyncManager.runSync(): Sync started');

    await this.syncOutgoingChanges(sessionId, newSyncClockTime);
    await this.syncIncomingChanges(sessionId);

    await this.centralServer.endSyncSession(sessionId);

    // clear persisted cache from last session
    await clearPersistedSyncSessionRecords();
  }

  /**
   * Syncing outgoing changes in batches
   * @param sessionId
   */
  async syncOutgoingChanges(sessionId: string, newSyncClockTime: number): Promise<void> {
    this.setSyncStage(1);

    // get the sync tick we're up to locally, so that we can store it as the successful push cursor
    const currentSyncTick = await getSyncTick(this.models, CURRENT_SYNC_TIME);

    // use the new unique tick for any changes from now on so that any records that are created or
    // updated even mid way through this sync, are marked using the new tick and will be captured in
    // the next push
    await setSyncTick(this.models, CURRENT_SYNC_TIME, newSyncClockTime);

    const pushSince = await getSyncTick(this.models, LAST_SUCCESSFUL_PUSH);
    console.log(
      `MobileSyncManager.syncOutgoingChanges(): Begin syncing outgoing changes since ${pushSince}`,
    );

    const modelsToPush = getModelsForDirection(this.models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL);
    const outgoingChanges = await snapshotOutgoingChanges(modelsToPush, pushSince);

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
      );
    }

    this.lastSyncPushedRecordsCount = outgoingChanges.length;

    await setSyncTick(this.models, LAST_SUCCESSFUL_PUSH, currentSyncTick);

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

    const pullSince = await getSyncTick(this.models, LAST_SUCCESSFUL_PULL);
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
    const tablesForFullResync = await this.models.LocalSystemFact.findOne({
      where: { key: 'tablesForFullResync' },
    });
    const { totalPulled, pullUntil } = await pullIncomingChanges(
      this.centralServer,
      sessionId,
      pullSince,
      Object.values(this.models).map(m => m.getTableNameForSync()),
      tablesForFullResync?.value.split(','),
      (total, downloadedChangesTotal) =>
        this.updateProgress(total, downloadedChangesTotal, 'Pulling all new changes...'),
    );

    console.log(`MobileSyncManager.syncIncomingChanges(): Saving ${totalPulled} changes`);

    const incomingModels = getModelsForDirection(this.models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);

    this.setSyncStage(3);

    // Save all incoming changes in 1 transaction so that the whole sync session save
    // either fail 100% or succeed 100%, no partial save.
    await Database.client.transaction(async () => {
      if (totalPulled > 0) {
        await saveIncomingChanges(sessionId, totalPulled, incomingModels, this.updateProgress);
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

    this.lastSyncPulledRecordsCount = totalPulled;

    console.log(
      `MobileSyncManager.syncIncomingChanges(): End sync incoming changes, incoming changes count: ${totalPulled}`,
    );
  }
}
