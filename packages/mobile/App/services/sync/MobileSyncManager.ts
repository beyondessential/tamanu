import mitt from 'mitt';

import { Database } from '../../infra/db';
import { MODELS_MAP } from '../../models/modelsMap';
import { CentralServerConnection } from './CentralServerConnection';
import {
  getModelsForDirection,
  getSyncTick,
  pushOutgoingChanges,
  setSyncTick,
  snapshotOutgoingChanges,
  getTransactingModelsForDirection,
} from './utils';
import {
  dropSnapshotTable,
  createSnapshotTable,
  insertSnapshotRecords,
} from './utils/manageSnapshotTable';
import { SYNC_DIRECTIONS } from '../../models/types';
import { SYNC_EVENT_ACTIONS } from './types';
import { CURRENT_SYNC_TIME, LAST_SUCCESSFUL_PULL, LAST_SUCCESSFUL_PUSH } from './constants';
import { SETTING_KEYS } from '~/constants/settings';
import { SettingsService } from '../settings';
import { pullRecordsInBatches } from './utils/pullRecordsInBatches';
import { saveChangesFromSnapshot, saveChangesFromMemory } from './utils/saveIncomingChanges';

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

export type MobileSyncSettings = {
  maxBatchesToKeepInMemory: number;
  maxRecordsPerInsertBatch: number;
  maxRecordsPerSnapshotBatch: number;
  useUnsafeSchemaForInitialSync: boolean;
};

export const SYNC_STAGES_TOTAL = Object.values(STAGE_MAX_PROGRESS).length;

export interface PullParams {
  sessionId: string;
  recordTotal: number;
  centralServer: CentralServerConnection;
  syncSettings: MobileSyncSettings;
  pullUntil: number;
  progressCallback: (incrementalPulled: number) => void;
}

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
  settings: SettingsService;

  constructor(centralServer: CentralServerConnection, settings: SettingsService) {
    this.centralServer = centralServer;
    this.settings = settings;
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
  updateProgress = (
    total: number,
    progress: number,
    progressMessage: string,
    // isInitialSync: boolean = false,
  ): void => {
    const progressByStage = STAGE_MAX_PROGRESS;
    // Get previous stage max progress
    const previousProgress = progressByStage[this.syncStage - 1] || 0;
    // Calculate the total progress of the current stage
    const progressDenominator = progressByStage[this.syncStage] - previousProgress;
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
    await dropSnapshotTable();

    const pullSince = await getSyncTick(this.models, LAST_SUCCESSFUL_PULL);
    // the first step of sync is to start a session and retrieve the session id
    const {
      sessionId,
      startedAtTick: newSyncClockTime,
      status,
    } = await this.centralServer.startSyncSession({
      urgent,
      lastSyncedTick: pullSince,
    });

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

    this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_STARTED);

    const syncSettings = this.settings.getSetting<MobileSyncSettings>('mobileSync');

    await this.syncOutgoingChanges(sessionId, newSyncClockTime);
    await this.pullChanges(sessionId, syncSettings);

    await this.centralServer.endSyncSession(sessionId);

    // clear persisted cache from this session
    await dropSnapshotTable();

    this.lastSuccessfulSyncTime = new Date();
    this.setProgress(0, '');
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

  async pullChanges(sessionId: string, syncSettings: MobileSyncSettings): Promise<void> {
    this.setSyncStage(2);
    const pullSince = await getSyncTick(this.models, LAST_SUCCESSFUL_PULL);
    const isInitialSync = pullSince === -1;

    const tablesForFullResyncSetting = await this.models.LocalSystemFact.findOne({
      where: { key: 'tablesForFullResync' },
    });
    const tablesForFullResync = tablesForFullResyncSetting?.value.split(',');

    const incomingModels = getModelsForDirection(this.models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);
    const tableNames = Object.values(incomingModels).map(m => m.getTableName());

    const { totalToPull, pullUntil } = await this.centralServer.initiatePull(
      sessionId,
      pullSince,
      tableNames,
      tablesForFullResync,
    );

    let totalPulled = 0;
    const progressCallback = (incrementalPulled: number) => {
      totalPulled += incrementalPulled;
      this.updateProgress(totalToPull, totalPulled, 'Pulling all new changes...');
    };

    const pullParams: PullParams = {
      sessionId,
      recordTotal: totalToPull,
      centralServer: this.centralServer,
      syncSettings,
      pullUntil,
      progressCallback,
    };
    if (isInitialSync) {
      await this.pullInitialSync(pullParams);
    } else {
      await this.pullIncrementalSync(pullParams);
    }
  }

  async pullInitialSync({
    sessionId,
    recordTotal,
    pullUntil,
    syncSettings,
    progressCallback,
  }: PullParams): Promise<void> {
    await Database.setUnsafePragma();
    await Database.client.transaction(async transactionEntityManager => {
      const incomingModels = getTransactingModelsForDirection(
        this.models,
        SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        transactionEntityManager,
      );
      const processStreamedDataFunction = async (records: any) => {
        await saveChangesFromMemory(records, incomingModels, syncSettings, progressCallback);
      };

      await pullRecordsInBatches(
        { centralServer: this.centralServer, sessionId, recordTotal, progressCallback },
        processStreamedDataFunction,
      );
      await this.postPull(transactionEntityManager, pullUntil);
    });
  }

  async pullIncrementalSync({
    sessionId,
    recordTotal,
    centralServer,
    syncSettings,
    progressCallback,
    pullUntil,
  }: PullParams): Promise<void> {
    const { maxRecordsPerSnapshotBatch = 1000 } = syncSettings;
    const processStreamedDataFunction = async (records: any) => {
      await insertSnapshotRecords(records, maxRecordsPerSnapshotBatch);
    };

    await createSnapshotTable();
    await pullRecordsInBatches(
      { centralServer, sessionId, recordTotal, progressCallback },
      processStreamedDataFunction,
    );

    this.setSyncStage(3);
    await Database.client.transaction(async transactionEntityManager => {
      const incomingModels = getTransactingModelsForDirection(
        this.models,
        SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        transactionEntityManager,
      );
      await saveChangesFromSnapshot(incomingModels, syncSettings, progressCallback);
      await this.postPull(transactionEntityManager, pullUntil);
    });
  }

  async postPull(entityManager: any, pullUntil: number) {
    const localSystemFactRepository = entityManager.getRepository('LocalSystemFact');
    
    const tablesForFullResync = await localSystemFactRepository.findOne({
      where: { key: 'tablesForFullResync' },
    });

    if (tablesForFullResync) {
      await localSystemFactRepository.delete(tablesForFullResync);
    }

    const lastSuccessfulPull = await localSystemFactRepository.findOne({
      where: { key: LAST_SUCCESSFUL_PULL },
    });

    if (lastSuccessfulPull) {
      lastSuccessfulPull.value = pullUntil.toString();
      await localSystemFactRepository.save(lastSuccessfulPull);
    } else {
      await localSystemFactRepository.insert({
        key: LAST_SUCCESSFUL_PULL,
        value: pullUntil.toString(),
      });
    }
  }
}
