import mitt from 'mitt';

import { Database } from '../../infra/db';
import { MODELS_MAP } from '../../models/modelsMap';
import { CentralServerConnection } from './CentralServerConnection';
import {
  setSyncSessionSequence,
  snapshotOutgoingChanges,
  pushOutgoingChanges,
  pullIncomingChanges,
  saveIncomingChanges,
  getModelsForDirection,
  getSyncSessionIndex,
} from './utils';
import { SYNC_DIRECTIONS } from '../../models/types';
import { SYNC_EVENT_ACTIONS } from './types';
import { formatDate } from '../../ui/helpers/date';
import { DateFormats } from '../../ui/helpers/constants';

export class MobileSyncManager {
  isSyncing = false;

  progress = 0;

  progressMessage = '';

  lastSyncTime = '';

  lastSyncPushedRecordsCount: number = null;

  lastSyncPulledRecordsCount: number = null;

  emitter = mitt();

  errors = [];

  models: typeof MODELS_MAP;

  centralServer: CentralServerConnection;

  constructor(centralServer: CentralServerConnection) {
    this.centralServer = centralServer;
    this.models = Database.models;
    this.createEmitterListener();
  }

  /**
   * Create emitter listener to listen to any errors happening during the sync,
   * and then the errors can be shown in the Syn screen (SyncErrorDisplay)
   */
  createEmitterListener(): void {
    this.emitter.on('*', (action, ...args) => {
      switch (action) {
        case SYNC_EVENT_ACTIONS.SYNC_RECORD_ERROR: {
          const syncError = args[0];
          this.errors.push(syncError);
          console.warn('Sync record error', syncError);
          break;
        }
        case SYNC_EVENT_ACTIONS.SYNC_ERROR: {
          const syncError = args[0].error;
          this.errors.push(syncError);
          console.warn('Sync error', syncError);
          break;
        }
        default: {
          console.warn('Unknown action: ', action);
        }
      }
    });
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
    } catch (e) {
      this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_ERROR, { error: e.message });
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
    this.errors = [];
    this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_STARTED);

    // Clear previous temp data for persisting
    await this.models.SessionSyncRecord.clear();

    // the first step of sync is to start a session and retrieve the index used as both the id of
    // the session, and a marker on the global sync timeline
    const currentSessionIndex = await this.centralServer.startSyncSession();
    const lastSuccessfulSessionIndex = await getSyncSessionIndex('LastSuccessfulSyncSession');

    console.log(
      `MobileSyncManager.runSync(): Sync started with session index ${currentSessionIndex}, last successful session index: ${lastSuccessfulSessionIndex}`,
    );

    // persist the session index in LocalSystemFact table now
    // so that any records that are created or updated from this point on, even mid way through this
    // sync, are marked using the new index and will be captured in the next sync
    await setSyncSessionSequence(this.models, currentSessionIndex, 'CurrentSyncSession');

    await this.syncOutgoingChanges(currentSessionIndex, lastSuccessfulSessionIndex);
    await this.syncIncomingChanges(currentSessionIndex, lastSuccessfulSessionIndex);

    await this.centralServer.endSyncSession(currentSessionIndex);

    // Clear previous temp data for persisting
    await this.models.SessionSyncRecord.clear();
  }

  /**
   * Syncing outgoing changes in batches
   * @param currentSessionIndex
   * @param lastSuccessfulSessionIndex
   */
  async syncOutgoingChanges(
    currentSessionIndex: number,
    lastSuccessfulSessionIndex: number,
  ): Promise<void> {
    console.log('MobileSyncManager.syncOutgoingChanges(): Begin sync outgoing changes');

    const modelsToPush = getModelsForDirection(this.models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL);
    const outgoingChanges = await snapshotOutgoingChanges(modelsToPush, lastSuccessfulSessionIndex);

    if (outgoingChanges.length > 0) {
      await pushOutgoingChanges(
        this.centralServer,
        currentSessionIndex,
        outgoingChanges,
        (total, pushedRecords) =>
          this.updateProgress(total, pushedRecords, 'Stage 1/3: Pushing all new changes'),
      );
    }

    this.lastSyncPushedRecordsCount = outgoingChanges.length;

    console.log(
      `MobileSyncManager.syncOutgoingChanges(): End sync outgoing changes, outgoing changes count: ${outgoingChanges.length}`,
    );
  }

  /**
   * Syncing incoming changes happens in two phases:
   * pulling all the records from the server (in batches),
   * then saving all those records into the local database
   * this avoids a period of time where the the local database may be "partially synced"
   * @param currentSessionIndex
   * @param lastSessionIndex
   */
  async syncIncomingChanges(currentSessionIndex: number, lastSessionIndex: number): Promise<void> {
    console.log('MobileSyncManager.syncIncomingChanges(): Begin sync incoming changes');

    const incomingChangesCount = await pullIncomingChanges(
      this.centralServer,
      this.models,
      currentSessionIndex,
      lastSessionIndex,
      (total, downloadedChangesTotal) =>
        this.updateProgress(total, downloadedChangesTotal, 'Stage 2/3: Pulling all new changes'),
    );

    if (incomingChangesCount > 0) {
      console.log(
        `MobileSyncManager.syncIncomingChanges(): Saving ${incomingChangesCount} changes`,
      );

      const incomingModels = getModelsForDirection(this.models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);

      // Save all incoming changes in 1 transaction so that the whole sync session save
      // either fail 100% or suceed 100%, no partial save.
      await Database.client.transaction(async () => {
        await saveIncomingChanges(this.models, incomingModels, this.updateProgress);

        // update the last successful sync in the same save transaction,
        // if updating the cursor fails, we want to roll back the rest of the saves
        // so that we don't end up detecting them as needing a sync up
        // to the central server when we attempt to resync from the same old cursor
        await setSyncSessionSequence(this.models, currentSessionIndex, 'LastSuccessfulSyncSession');
      });
    }

    this.lastSyncPulledRecordsCount = incomingChangesCount;

    console.log(
      `MobileSyncManager.syncIncomingChanges(): End sync incoming changes, incoming changes count: ${incomingChangesCount}`,
    );
  }
}
