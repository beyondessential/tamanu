import mitt from 'mitt';

import { Database } from '~/infra/db';

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
import { SYNC_DIRECTIONS } from '~/models/constants';
import { SYNC_EVENT_ACTIONS } from '../../constants';

export class MobileSyncManager {
  isSyncing = false;

  progress = 0;

  progressMessage = '';

  emitter = mitt();

  errors = [];

  models;

  centralServer: CentralServerConnection;

  constructor(centralServer: CentralServerConnection) {
    this.centralServer = centralServer;
    this.models = Database.models;
    this.createEmitterListener();
  }

  createEmitterListener() {
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
      }
    });
  }

  setProgress(progress: number, progressMessage: string): void {
    this.progress = progress;
    this.progressMessage = progressMessage;
    this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_IN_PROGRESS, this.progress);
  }

  updateProgress = (total: number, batchTotal: number, progressMessage: string): void => {
    const progressPercentage = Math.min(Math.ceil((batchTotal / total) * 100));
    this.setProgress(progressPercentage, progressMessage);
  };

  async waitForEnd(): Promise<void> {
    if (this.isSyncing) {
      return new Promise(resolve => {
        const done = (): void => {
          resolve();
          this.emitter.off(SYNC_EVENT_ACTIONS.SYNC_ENDED, done);
        };
        this.emitter.on(SYNC_EVENT_ACTIONS.SYNC_ENDED, done);
      });
    }
  }

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
    } catch (e) {
      this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_ERROR, { error: e.message });
    } finally {
      this.isSyncing = false;
      this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_ENDED, `time=${Date.now() - startTime}ms`);
    }

    console.info(`Sync took ${Date.now() - startTime} ms`);
  }

  async runSync(): Promise<void> {
    if (this.isSyncing) {
      throw new Error('MobileSyncManager.runSync(): Tried to start syncing while sync in progress');
    }

    console.info(`MobileSyncManager.runSync(): Began sync run`);

    this.isSyncing = true;
    this.errors = [];
    this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_STARTED);

    const currentSessionIndex = await this.centralServer.startSyncSession();

    const lastSuccessfulSessionIndex = await getSyncSessionIndex('LastSuccessfulSyncSession');

    console.info(
      `MobileSyncManager.runSync(): Sync started with session index ${currentSessionIndex}, last successful session index: ${lastSuccessfulSessionIndex}`,
    );

    await setSyncSessionSequence(this.models, currentSessionIndex, 'CurrentSyncSession');

    await this.syncOutgoingChanges(currentSessionIndex, lastSuccessfulSessionIndex);

    await this.syncIncomingChanges(currentSessionIndex, lastSuccessfulSessionIndex);

    this.setProgress(0, '');

    await setSyncSessionSequence(this.models, currentSessionIndex, 'LastSuccessfulSyncSession');

    await this.centralServer.endSyncSession(currentSessionIndex);
  }

  async syncOutgoingChanges(
    currentSessionIndex: number,
    lastSuccessfulSessionIndex: number,
  ): Promise<void> {
    console.info(`MobileSyncManager.syncOutgoingChanges(): Began sync outgoing changes`);

    const modelsToPush = getModelsForDirection(this.models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL);

    const outgoingChanges = await snapshotOutgoingChanges(modelsToPush, lastSuccessfulSessionIndex);

    if (outgoingChanges.length > 0) {
      await pushOutgoingChanges(
        this.centralServer,
        currentSessionIndex,
        outgoingChanges,
        (total, pushedRecords) =>
          this.updateProgress(total, pushedRecords, 'Stage 1/3: Pushing records'),
      );
    }

    console.info(
      `MobileSyncManager.syncOutgoingChanges(): End sync outgoing changes, outgoing changes count: ${outgoingChanges.length}`,
    );
  }

  async syncIncomingChanges(currentSessionIndex: number, lastSessionIndex: number): Promise<void> {
    console.info(`MobileSyncManager.syncIncomingChanges(): Began sync incoming changes`);

    const incomingChanges = await pullIncomingChanges(
      this.centralServer,
      currentSessionIndex,
      lastSessionIndex,
      (total, downloadedChangesTotal) =>
        this.updateProgress(total, downloadedChangesTotal, 'Stage 2/3: Pulling records'),
    );

    if (incomingChanges.length > 0) {
      console.info(
        `MobileSyncManager.syncIncomingChanges(): Saving ${incomingChanges.length} records`,
      );

      this.setProgress(0, 'Stage 3/3: Start saving records...');

      const modelsToPull = getModelsForDirection(this.models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);

      let failures = [];
      await Database.client.transaction(async () => {
        ({ failures } = await saveIncomingChanges(
          modelsToPull,
          incomingChanges,
          this.updateProgress,
        ));
      });

      failures.forEach(({ error, recordId }) =>
        this.emitter.emit(SYNC_EVENT_ACTIONS.SYNC_RECORD_ERROR, {
          record: { id: recordId },
          error,
        }),
      );

      if (failures.length > 0) {
        throw new Error(`Saving ${failures.length} individual record failures`);
      }

      return;
    }

    console.info('MobileSyncManager.syncIncomingChanges(): No changes to push');
  }
}
