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

export class MobileSyncManager {
  isSyncing = false;

  progress = 0;

  progressMessage = '';

  lastSyncTime = '';

  lastSyncPushedRecordsCount: number = null;

  lastSyncPulledRecordsCount: number = null;

  emitter = mitt();

  models: typeof MODELS_MAP;

  centralServer: CentralServerConnection;

  constructor(centralServer: CentralServerConnection) {
    this.centralServer = centralServer;
    this.models = Database.models;
  }

  /**
   * Set the current progress (%) and the current progress message for the circular progress bar
   * @param progress
   * @param progressMessage
   */
  setProgress(progress: number, progressMessage: string): void {
    this.progress = progress;
    this.progressMessage = progressMessage;
    this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_IN_PROGRESS, this.progress);
  }

  /**
   * Calculate the current progress (%) using the final total and the current records in progress
   * @param total
   * @param batchTotal
   * @param progressMessage
   */
  updateProgress = (total: number, batchTotal: number, progressMessage: string): void => {
    const progressPercentage = Math.min(Math.ceil((batchTotal / total) * 100));
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
      this.setProgress(0, '');
    } catch (error) {
      this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_ERROR, { error });
    } finally {
      this.isSyncing = false;
      this.lastSyncTime = formatDate(new Date(), DateFormats.DATE_AND_TIME);
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
    this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_STARTED);

    // clear persisted cache from last session
    await clearPersistedSyncSessionRecords();

    // the first step of sync is to start a session and retrieve the session id
    const { sessionId, tick: newSyncClockTime } = await this.centralServer.startSyncSession();

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

    if (outgoingChanges.length > 0) {
      await pushOutgoingChanges(
        this.centralServer,
        sessionId,
        outgoingChanges,
        (total, pushedRecords) =>
          this.updateProgress(total, pushedRecords, 'Stage 1/3: Pushing all new changes'),
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
    const pullSince = await getSyncTick(this.models, LAST_SUCCESSFUL_PULL);
    console.log(
      `MobileSyncManager.syncIncomingChanges(): Begin sync incoming changes since ${pullSince}`,
    );

    const { count: incomingChangesCount, tick: safePullTick } = await pullIncomingChanges(
      this.centralServer,
      sessionId,
      pullSince,
      Object.values(this.models).map(m => m.getTableNameForSync()),
      (total, downloadedChangesTotal) =>
        this.updateProgress(total, downloadedChangesTotal, 'Stage 2/3: Pulling all new changes'),
    );

    console.log(`MobileSyncManager.syncIncomingChanges(): Saving ${incomingChangesCount} changes`);

    const incomingModels = getModelsForDirection(this.models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);

    // Save all incoming changes in 1 transaction so that the whole sync session save
    // either fail 100% or succeed 100%, no partial save.
    await Database.client.transaction(async () => {
      if (incomingChangesCount > 0) {
        await saveIncomingChanges(
          sessionId,
          incomingChangesCount,
          incomingModels,
          this.updateProgress,
        );
      }

      // update the last successful sync in the same save transaction,
      // if updating the cursor fails, we want to roll back the rest of the saves
      // so that we don't end up detecting them as needing a sync up
      // to the central server when we attempt to resync from the same old cursor
      await setSyncTick(this.models, LAST_SUCCESSFUL_PULL, safePullTick);
    });

    this.lastSyncPulledRecordsCount = incomingChangesCount;

    console.log(
      `MobileSyncManager.syncIncomingChanges(): End sync incoming changes, incoming changes count: ${incomingChangesCount}`,
    );
  }
}
