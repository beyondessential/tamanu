import { trace } from '@opentelemetry/api';
import { Op, QueryTypes } from 'sequelize';
import _config from 'config';
import { isNil } from 'lodash';

import { DEBUG_LOG_TYPES, SETTINGS_SCOPES } from '@tamanu/constants';
import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { log } from '@tamanu/shared/services/logging';
import {
  adjustDataPostSyncPush,
  bumpSyncTickForRepull,
  incomingSyncHook,
  completeSyncSession,
  countSyncSnapshotRecords,
  createSnapshotTable,
  findSyncSnapshotRecords,
  getModelsForPull,
  getModelsForPush,
  getSyncTicksOfPendingEdits,
  insertSnapshotRecords,
  removeEchoedChanges,
  saveIncomingChanges,
  updateSnapshotRecords,
  waitForPendingEditsUsingSyncTick,
  repeatableReadTransaction,
  SYNC_SESSION_DIRECTION,
  SYNC_TICK_FLAGS,
} from '@tamanu/database/sync';
import { attachChangelogToSnapshotRecords, pauseAudit } from '@tamanu/database/utils/audit';
import { uuidToFairlyUniqueInteger } from '@tamanu/shared/utils';

import { getLookupSourceTickRange } from './getLookupSourceTickRange';
import { getPatientLinkedModels } from './getPatientLinkedModels';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';
import { filterModelsFromName } from './filterModelsFromName';
import { startSnapshotWhenCapacityAvailable } from './startSnapshotWhenCapacityAvailable';
import { createMarkedForSyncPatientsTable } from './createMarkedForSyncPatientsTable';
import { updateLookupTable, updateSyncLookupPendingRecords } from './updateLookupTable';

const errorMessageFromSession = (session) =>
  `Sync session '${session.id}' encountered an error: ${session.errors[session.errors.length - 1]}`;

// Session-wide timing aggregator for complete sync session benchmarks
// Creates a comprehensive benchmark across all operations in a sync session
const createSessionTimingAggregator = (sessionId, store) => {
  const sessionStartTime = Date.now();
  const operations = new Map(); // Track all operations in this session
  
  return {
    createOperationTimer: (operation, isMobile = false) => {
      const operationStartTime = Date.now();
      const timing = createTimingLogger(operation, sessionId, isMobile, store);
      
      // Override the saveTimingsToDebugInfo to aggregate into session-wide benchmark
      const originalSaveTimings = timing.saveTimingsToDebugInfo;
      timing.saveTimingsToDebugInfo = async function(additionalData = {}) {
        const benchmarkData = this.getBenchmarkData();
        
        // Store this operation's benchmark data
        operations.set(operation, {
          operation,
          isMobile,
          startTime: operationStartTime,
          endTime: Date.now(),
          ...benchmarkData,
          ...additionalData,
        });
        
        // Also save individual operation timing (for backward compatibility)
        await originalSaveTimings.call(this, additionalData);
        
        // Save aggregated session benchmark
        await this.saveSessionBenchmark();
      };
      
      // Add method to save complete session benchmark
      timing.saveSessionBenchmark = async () => {
        if (!store || !sessionId) return;
        
        const sessionEndTime = Date.now();
        const sessionTotalDuration = sessionEndTime - sessionStartTime;
        
        // Aggregate all operations
        const allOperations = [];
        let totalActionCount = 0;
        let totalActionCalls = 0;
        
        operations.forEach((opData) => {
          allOperations.push({
            name: opData.operation,
            startTime: new Date(opData.startTime).toISOString(),
            endTime: new Date(opData.endTime).toISOString(),
            totalDurationMs: opData.grandTotal.totalDurationMs,
            actionCount: opData.grandTotal.actionCount,
            totalActionCalls: opData.grandTotal.totalActionCalls,
            actions: opData.actions,
            timeline: opData.timeline,
          });
          
          totalActionCount += opData.grandTotal.actionCount;
          totalActionCalls += opData.grandTotal.totalActionCalls;
        });
        
        const sessionBenchmark = {
          sessionId,
          sessionStartTime: new Date(sessionStartTime).toISOString(),
          sessionEndTime: new Date(sessionEndTime).toISOString(),
          sessionTotalDurationMs: sessionTotalDuration,
          grandTotal: {
            totalDurationMs: sessionTotalDuration,
            operationCount: allOperations.length,
            actionCount: totalActionCount,
            totalActionCalls: totalActionCalls,
          },
          operations: allOperations,
        };
        
        try {
          await store.models.SyncSession.addDebugInfo(sessionId, {
            sessionBenchmark,
          });
          log.debug('CentralSyncManager.sessionBenchmark.saved', {
            sessionId,
            totalDurationMs: sessionTotalDuration,
            operationCount: allOperations.length,
          });
        } catch (error) {
          log.error('CentralSyncManager.sessionBenchmark.error', {
            sessionId,
            error: error.message,
          });
        }
      };
      
      return timing;
    },
    
    // Method to finalize and save the complete session benchmark
    finalizeSession: async () => {
      if (!store || !sessionId) return;
      
      const sessionEndTime = Date.now();
      const sessionTotalDuration = sessionEndTime - sessionStartTime;
      
      // Create final aggregated benchmark
      const allOperations = [];
      let totalActionCount = 0;
      let totalActionCalls = 0;
      
      operations.forEach((opData) => {
        allOperations.push({
          name: opData.operation,
          startTime: new Date(opData.startTime).toISOString(),
          endTime: new Date(opData.endTime).toISOString(),
          totalDurationMs: opData.grandTotal.totalDurationMs,
          actionCount: opData.grandTotal.actionCount,
          totalActionCalls: opData.grandTotal.totalActionCalls,
          actions: opData.actions,
          timeline: opData.timeline,
        });
        
        totalActionCount += opData.grandTotal.actionCount;
        totalActionCalls += opData.grandTotal.totalActionCalls;
      });
      
      const finalSessionBenchmark = {
        sessionId,
        sessionStartTime: new Date(sessionStartTime).toISOString(),
        sessionEndTime: new Date(sessionEndTime).toISOString(),
        sessionTotalDurationMs: sessionTotalDuration,
        grandTotal: {
          totalDurationMs: sessionTotalDuration,
          operationCount: allOperations.length,
          actionCount: totalActionCount,
          totalActionCalls: totalActionCalls,
        },
        operations: allOperations,
      };
      
      try {
        await store.models.SyncSession.addDebugInfo(sessionId, {
          finalSessionBenchmark,
        });
        log.info('CentralSyncManager.finalSessionBenchmark.saved', {
          sessionId,
          totalDurationMs: sessionTotalDuration,
          operationCount: allOperations.length,
        });
      } catch (error) {
        log.error('CentralSyncManager.finalSessionBenchmark.error', {
          sessionId,
          error: error.message,
        });
      }
    },
  };
};

// Timing helper for sync performance metrics
// Creates a hierarchical benchmark structure similar to Final Fantasy XIV's performance tracking:
// - grandTotal: overall statistics for the entire operation
// - actions: array of main actions with their timing data and nested subActions
// - timeline: chronological log of all actions and sub-actions
const createTimingLogger = (operation, sessionId, isMobile = false, store = null) => {
  const startTime = Date.now();
  const startDate = new Date(startTime);
  const actions = new Map(); // Track actions and their subactions
  const actionLogs = []; // Track individual action logs with timestamps
  
  return {
    log: (action, additionalData = {}) => {
      const currentTime = Date.now();
      const duration = currentTime - startTime;
      
      // Create or update action entry
      if (!actions.has(action)) {
        actions.set(action, {
          name: action,
          totalDurationMs: 0,
          callCount: 0,
          subActions: [],
          firstCallAt: currentTime,
          lastCallAt: currentTime,
        });
      }
      
      const actionEntry = actions.get(action);
      actionEntry.totalDurationMs += duration;
      actionEntry.callCount += 1;
      actionEntry.lastCallAt = currentTime;
      
      // Store individual log entry
      const logEntry = {
        action,
        timestamp: new Date(currentTime).toISOString(),
        durationMs: duration,
        totalDurationMs: currentTime - startTime,
        ...additionalData,
      };
      actionLogs.push(logEntry);
      
      log.debug('CentralSyncManager.timing', {
        operation,
        action,
        sessionId,
        isMobile,
        durationMs: duration,
        totalDurationMs: currentTime - startTime,
        ...additionalData,
      });
    },
    
    // Add sub-action tracking for nested operations
    logSubAction: (parentAction, subAction, additionalData = {}) => {
      const currentTime = Date.now();
      const duration = currentTime - startTime;
      
      // Ensure parent action exists and is logged first
      if (!actions.has(parentAction)) {
        // Create the parent action entry
        actions.set(parentAction, {
          name: parentAction,
          totalDurationMs: 0,
          callCount: 0,
          subActions: [],
          firstCallAt: currentTime,
          lastCallAt: currentTime,
        });
        
        // Also log the parent action to the timeline
        const parentLogEntry = {
          action: parentAction,
          timestamp: new Date(currentTime).toISOString(),
          durationMs: 0, // Parent action starts with 0 duration
          totalDurationMs: currentTime - startTime,
        };
        actionLogs.push(parentLogEntry);
      }
      
      const parentEntry = actions.get(parentAction);
      
      // Find or create sub-action
      let subActionEntry = parentEntry.subActions.find(sa => sa.name === subAction);
      if (!subActionEntry) {
        subActionEntry = {
          name: subAction,
          totalDurationMs: 0,
          callCount: 0,
          firstCallAt: currentTime,
          lastCallAt: currentTime,
        };
        parentEntry.subActions.push(subActionEntry);
      }
      
      subActionEntry.totalDurationMs += duration;
      subActionEntry.callCount += 1;
      subActionEntry.lastCallAt = currentTime;
      
      // Update parent action timing
      parentEntry.totalDurationMs += duration;
      parentEntry.callCount += 1;
      parentEntry.lastCallAt = currentTime;
      
      // Store individual log entry
      const logEntry = {
        parentAction,
        subAction,
        timestamp: new Date(currentTime).toISOString(),
        durationMs: duration,
        totalDurationMs: currentTime - startTime,
        ...additionalData,
      };
      actionLogs.push(logEntry);
      
      log.debug('CentralSyncManager.timing.subAction', {
        operation,
        parentAction,
        subAction,
        sessionId,
        isMobile,
        durationMs: duration,
        totalDurationMs: currentTime - startTime,
        ...additionalData,
      });
    },
    
    getDuration: () => Date.now() - startTime,
    
    getBenchmarkData: () => {
      const totalDuration = Date.now() - startTime;
      const actionsArray = [];
      
      actions.forEach((actionData, actionName) => {
        actionsArray.push({
          name: actionName,
          totalDurationMs: actionData.totalDurationMs,
          callCount: actionData.callCount,
          averageDurationMs: actionData.totalDurationMs / actionData.callCount,
          firstCallAt: new Date(actionData.firstCallAt).toISOString(),
          lastCallAt: new Date(actionData.lastCallAt).toISOString(),
          subActions: actionData.subActions.map(sa => ({
            name: sa.name,
            totalDurationMs: sa.totalDurationMs,
            callCount: sa.callCount,
            averageDurationMs: sa.totalDurationMs / sa.callCount,
            firstCallAt: new Date(sa.firstCallAt).toISOString(),
            lastCallAt: new Date(sa.lastCallAt).toISOString(),
          })),
        });
      });
      
      return {
        grandTotal: {
          totalDurationMs: totalDuration,
          actionCount: actionsArray.length,
          totalActionCalls: actionsArray.reduce((sum, action) => sum + action.callCount, 0),
        },
        actions: actionsArray,
        timeline: actionLogs,
        sessionStartTime: startDate.toISOString(),
        sessionEndTime: new Date().toISOString(),
      };
    },
    
    logFinal: function(additionalData = {}) {
      const benchmarkData = this.getBenchmarkData();
      
      log.debug('CentralSyncManager.timing.final', {
        operation,
        sessionId,
        isMobile,
        benchmark: benchmarkData,
        ...additionalData,
      });
    },
    
    saveTimingsToDebugInfo: async function(additionalData = {}) {
      if (!store || !sessionId) {
        log.warn('CentralSyncManager.timing.saveTimingsToDebugInfo', {
          message: 'Cannot save timings - missing store or sessionId',
          hasStore: !!store,
          hasSessionId: !!sessionId,
        });
        return;
      }
      
      const benchmarkData = this.getBenchmarkData();
      
      try {
        await store.models.SyncSession.addDebugInfo(sessionId, {
          benchmark: {
            operation,
            isMobile,
            ...benchmarkData,
            ...additionalData,
          },
        });
        log.debug('CentralSyncManager.timing.savedToDebugInfo', {
          operation,
          sessionId,
          totalDurationMs: benchmarkData.grandTotal.totalDurationMs,
        });
      } catch (error) {
        log.error('CentralSyncManager.timing.saveTimingsToDebugInfo.error', {
          operation,
          sessionId,
          error: error.message,
        });
      }
    }
  };
};

// about variables lapsedSessionSeconds and lapsedSessionCheckFrequencySeconds:
// after x minutes of no activity, consider a session lapsed and wipe it to avoid holding invalid
// changes in the database when a sync fails on the facility server end

export class CentralSyncManager {
  static config = _config;

  static overrideConfig(override) {
    this.config = override;
  }

  static restoreConfig() {
    this.config = _config;
  }

  currentSyncTick;

  store;

  purgeInterval;
  
  // Session timing aggregators for tracking complete session benchmarks
  sessionTimingAggregators = new Map();

  constructor(ctx) {
    this.store = ctx.store;
    ctx.onClose(this.close);
  }

  close = () => {
    clearInterval(this.purgeInterval);
    // Finalize any remaining session benchmarks
    this.sessionTimingAggregators.forEach(async (aggregator) => {
      await aggregator.finalizeSession();
    });
    this.sessionTimingAggregators.clear();
  };
  
  // Get or create session timing aggregator for a session
  getSessionTimingAggregator(sessionId) {
    if (!this.sessionTimingAggregators.has(sessionId)) {
      this.sessionTimingAggregators.set(sessionId, createSessionTimingAggregator(sessionId, this.store));
    }
    return this.sessionTimingAggregators.get(sessionId);
  }
  
  // Create timing logger that integrates with session-wide benchmarking
  createOperationTiming(sessionId, operation, isMobile = false) {
    const sessionAggregator = this.getSessionTimingAggregator(sessionId);
    return sessionAggregator.createOperationTimer(operation, isMobile);
  }

  async getIsSyncCapacityFull() {
    const { maxConcurrentSessions } = this.constructor.config.sync;
    const activeSyncs = await this.store.models.SyncSession.findAll({
      where: {
        completedAt: null,
        errors: null,
      },
    });
    return activeSyncs.length >= maxConcurrentSessions;
  }

  async tickTockGlobalClock() {
    // rather than just incrementing by one tick, we "tick, tock" the clock so we guarantee the
    // "tick" part to be unique to the requesting client, and any changes made directly on the
    // central server will be recorded as updated at the "tock", avoiding any direct changes
    // (e.g. imports) being missed by a client that is at the same sync tick
    const tock = await this.store.models.LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);
    return { tick: tock - 1, tock };
  }

  async startSession({ deviceId, facilityIds, isMobile, ...debugInfo } = {}) {
    
    // as a side effect of starting a new session, cause a tick on the global sync clock
    // this is a convenient way to tick the clock, as it means that no two sync sessions will
    // happen at the same global sync time, meaning there's no ambiguity when resolving conflicts
    
    const sessionId = await this.store.models.SyncSession.generateDbUuid();
    const timing = this.createOperationTiming(sessionId, 'startSession', isMobile);
    timing.log('generateSessionId');
    
    const startTime = new Date();
    const parameters = { deviceId, facilityIds, isMobile };

    const unmarkSessionAsProcessing = await this.markSessionAsProcessing(sessionId);
    timing.log('markSessionAsProcessing');
    
    const syncSession = await this.store.models.SyncSession.create({
      id: sessionId,
      startTime,
      lastConnectionTime: startTime,
      debugInfo,
      parameters,
    });
    timing.log('createSyncSession');

    // no await as prepare session (especially the tickTockGlobalClock action) might get blocked
    // and take a while if the central server is concurrently persisting records from another client.
    // Client should poll for the result later.
    const preparation = this.prepareSession(syncSession).finally(unmarkSessionAsProcessing);

    // ...but in unit tests, the tests interfere with each other if we leave prepares running
    // in the background! So, allow overriding the above behaviour.
    if (this.constructor.config.sync.awaitPreparation) {
      await preparation;
    }

    timing.log('sessionStartComplete', { sessionId: syncSession.id });

    // Save timing data to debug_info
    await timing.saveTimingsToDebugInfo({ sessionId: syncSession.id });

    log.info('CentralSyncManager.startSession', {
      sessionId: syncSession.id,
      ...parameters,
      ...debugInfo,
    });

    return { sessionId: syncSession.id };
  }

  async prepareSession(syncSession) {
    const timing = this.createOperationTiming(syncSession.id, 'prepareSession', syncSession.parameters?.isMobile);
    
    try {
      // if the sync_lookup table is enabled, don't allow syncs until it has finished its first update run
      const syncLookupUpToTick =
        await this.store.models.LocalSystemFact.get(FACT_LOOKUP_UP_TO_TICK);
      timing.log('checkSyncLookupTable');
      
      if (this.constructor.config.sync.lookupTable.enabled && isNil(syncLookupUpToTick)) {
        throw new Error(`Sync lookup table has not yet built. Cannot initiate sync.`);
      }

      await createSnapshotTable(this.store.sequelize, syncSession.id);
      timing.log('createSnapshotTable');
      
      const { tick } = await this.tickTockGlobalClock();
      timing.log('tickTockGlobalClock');
      
      await syncSession.markAsStartedAt(tick);
      timing.log('markAsStartedAt');

      // eslint-disable-next-line no-unused-expressions
      trace.getActiveSpan()?.setAttributes({
        'app.sync.sessionId': syncSession.id,
        'app.sync.tick': tick,
      });

      timing.log('prepareSessionComplete', { tick });
      return { sessionId: syncSession.id, tick };
    } catch (error) {
      timing.log('prepareSessionError', { error: error.message });
      log.error('CentralSyncManager.prepareSession encountered an error', error);
      await this.store.models.SyncSession.markSessionErrored(syncSession.id, error.message);
    } finally {
      // Save timing data to debug_info
      await timing.saveTimingsToDebugInfo();
    }
  }

  async connectToSession(sessionId) {
    const session = await this.store.sequelize.models.SyncSession.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Sync session '${sessionId}' not found`);
    }

    const { syncSessionTimeoutMs } = this.constructor.config.sync;
    if (
      syncSessionTimeoutMs &&
      !session.errors &&
      session.updatedAt - session.createdAt > syncSessionTimeoutMs
    ) {
      await session.markErrored(`Sync session ${sessionId} timed out`);
    }

    if (session.errors) {
      throw new Error(errorMessageFromSession(session));
    }
    if (session.completedAt) {
      throw new Error(`Sync session '${sessionId}' is already completed`);
    }
    await session.update({ lastConnectionTime: Date.now() });

    // eslint-disable-next-line no-unused-expressions
    trace.getActiveSpan()?.setAttributes({
      'app.sync.sessionId': sessionId,
    });

    return session;
  }

  async endSession(sessionId) {
    const session = await this.connectToSession(sessionId);
    const durationMs = Date.now() - session.startTime;
    log.debug('CentralSyncManager.completingSession', { sessionId, durationMs });
    await completeSyncSession(this.store, sessionId);
    
    // Finalize and save the complete session benchmark
    const sessionAggregator = this.sessionTimingAggregators.get(sessionId);
    if (sessionAggregator) {
      await sessionAggregator.finalizeSession();
      this.sessionTimingAggregators.delete(sessionId);
    }
    
    log.info('CentralSyncManager.completedSession', {
      sessionId,
      durationMs,
      facilityIds: session.parameters.facilityIds,
      deviceId: session.parameters.deviceId,
    });
  }

  async markSessionAsProcessing(sessionId) {
    // Mark the session as processing something asynchronous in a way that
    // a) can be read across processes, if the central server is running in cluster mode; and
    // b) will automatically get cleared if the process restarts
    // A transaction level advisory lock fulfils both of these criteria, as it sits at the database
    // level (independent of an individual node process), but will be unlocked if the transaction is
    // rolled back for any reason (e.g. the server restarts)
    const transaction = await this.store.sequelize.transaction();
    await this.store.sequelize.query('SELECT pg_advisory_xact_lock(:sessionLockId);', {
      replacements: { sessionLockId: uuidToFairlyUniqueInteger(sessionId) },
      transaction,
    });
    const unmarkSessionAsProcessing = async () => {
      await transaction.commit();
    };
    return unmarkSessionAsProcessing;
  }

  async checkSessionIsProcessing(sessionId) {
    const [rows] = await this.store.sequelize.query(
      'SELECT NOT(pg_try_advisory_xact_lock(:sessionLockId)) AS session_is_processing;',
      {
        replacements: { sessionLockId: uuidToFairlyUniqueInteger(sessionId) },
      },
    );
    return rows[0].session_is_processing;
  }

  // set pull filter begins creating a snapshot of changes to pull at this point in time
  async initiatePull(sessionId, params) {
    const timing = this.createOperationTiming(sessionId, 'initiatePull', params?.isMobile);
    
    try {
      await this.connectToSession(sessionId);
      timing.log('connectToSession');

      // first check if the snapshot is already being processed, to throw a sane error if (for some
      // reason) the client managed to kick off the pull twice (ran into this in v1.24.0 and v1.24.1)
      const isAlreadyProcessing = await this.checkSessionIsProcessing(sessionId);
      timing.log('checkSessionIsProcessing');
      
      if (isAlreadyProcessing) {
        throw new Error(`Snapshot for session ${sessionId} is already being processed`);
      }

      const unmarkSessionAsProcessing = await this.markSessionAsProcessing(sessionId);
      timing.log('markSessionAsProcessing');
      
      this.setupSnapshotForPull(sessionId, params, unmarkSessionAsProcessing); // don't await, as it takes a while - the sync client will poll for it to finish
      timing.log('setupSnapshotForPullStarted');
    } catch (error) {
      timing.log('initiatePullError', { error: error.message });
      log.error('CentralSyncManager.initiatePull encountered an error', error);
      await this.store.models.SyncSession.markSessionErrored(sessionId, error.message);
    } finally {
      // Save timing data to debug_info
      await timing.saveTimingsToDebugInfo();
    }
  }

  async updateLookupTable() {
    const { store } = this;

    const debugObject = await store.models.DebugLog.create({
      type: DEBUG_LOG_TYPES.SYNC_LOOKUP_UPDATE,
      info: {
        startedAt: new Date(),
      },
    });

    try {
      // get a sync tick that we can safely consider the snapshot to be up to (because we use the
      // "tick" of the tick-tock, so we know any more changes on the server, even while the snapshot
      // process is ongoing, will have a later updated_at_sync_tick)
      const { tick: currentTick } = await this.tickTockGlobalClock();

      await this.waitForPendingEdits(currentTick);

      const previouslyUpToTick =
        (await store.models.LocalSystemFact.get(FACT_LOOKUP_UP_TO_TICK)) || -1;

      await debugObject.addInfo({ since: previouslyUpToTick });

      const isInitialBuildOfLookupTable = parseInt(previouslyUpToTick, 10) === -1;

      await repeatableReadTransaction(store.sequelize, async (transaction) => {
        // do not need to update pending records when it is initial build
        // because it uses ticks from the actual tables for updated_at_sync_tick
        if (isInitialBuildOfLookupTable) {
          await this.store.models.SyncLookupTick.create({
            sourceStartTick: previouslyUpToTick,
            lookupEndTick: currentTick,
          });
        } else {
          transaction.afterCommit(async () => {
            // Wrap inside transaction so that any writes to currentSyncTick
            // will have to wait until this transaction is committed
            await store.sequelize.transaction(async () => {
              const { tick: lookupEndTick } = await this.tickTockGlobalClock();
              await updateSyncLookupPendingRecords(store, lookupEndTick);
              await this.store.models.SyncLookupTick.create({
                sourceStartTick: previouslyUpToTick,
                lookupEndTick: lookupEndTick,
              });
            });
          });
        }

        // When it is initial build of sync lookup table, by setting it to null,
        // it will get the updated_at_sync_tick from the actual tables.
        // Otherwise, update it to SYNC_LOOKUP_PENDING_UPDATE_FLAG so that
        // it can update the flagged ones post transaction commit to the latest sync tick,
        // avoiding sync sessions missing records while sync lookup is being refreshed
        const syncLookupTick = isInitialBuildOfLookupTable
          ? null
          : SYNC_TICK_FLAGS.LOOKUP_PENDING_UPDATE;

        await updateLookupTable(
          getModelsForPull(this.store.models),
          previouslyUpToTick,
          this.constructor.config,
          syncLookupTick,
          debugObject,
        );

        // update the last successful lookup table in the same transaction - if updating the cursor fails,
        // we want to roll back the rest of the saves so that the next update can still detect the records that failed
        // to be updated last time
        log.debug('CentralSyncManager.updateLookupTable()', {
          lastSuccessfulLookupTableUpdate: currentTick,
        });
        await store.models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, currentTick);
      });
    } catch (error) {
      log.error('CentralSyncManager.updateLookupTable encountered an error', {
        error: error.message,
      });

      await debugObject.addInfo({
        error: error.message,
      });

      throw error;
    } finally {
      await debugObject.addInfo({
        completedAt: new Date(),
      });
    }
  }

  async waitForPendingEdits(tick, sessionId) {
    const timing = this.createOperationTiming(sessionId, 'waitForPendingEdits', true); // Assume mobile for performance tracking
    
    // get all the ticks (ie: keys of in-flight transaction advisory locks) of previously pending edits
    const pendingSyncTicks = (await getSyncTicksOfPendingEdits(this.store.sequelize)).filter(
      (t) => t < tick,
    );
    timing.log('getSyncTicksOfPendingEdits', { 
      pendingSyncTicksCount: pendingSyncTicks.length,
      tick 
    });

    // wait for any in-flight transactions of pending edits
    // that we don't miss any changes that are in progress
    await Promise.all(
      pendingSyncTicks.map((t) => waitForPendingEditsUsingSyncTick(this.store.sequelize, t)),
    );
    timing.log('waitForPendingEditsComplete');
  }

  async setupSnapshotForPull(
    sessionId,
    { since, facilityIds, tablesToInclude, tablesForFullResync, deviceId },
    unmarkSessionAsProcessing,
  ) {
    const timing = this.createOperationTiming(sessionId, 'setupSnapshotForPull', true); // Assume mobile for performance tracking
    let transactionTimeout;
    try {
      const { models, sequelize } = this.store;

      const session = await this.connectToSession(sessionId);
      timing.log('connectToSession');

      // will wait for concurrent snapshots to complete if we are currently at capacity, then
      // set the snapshot_started_at timestamp before we proceed with the heavy work below
      await startSnapshotWhenCapacityAvailable(sequelize, sessionId);
      timing.log('startSnapshotWhenCapacityAvailable');

      // get a sync tick that we can safely consider the snapshot to be up to (because we use the
      // "tick" of the tick-tock, so we know any more changes on the server, even while the snapshot
      // process is ongoing, will have a later updated_at_sync_tick)
      const { tick } = await this.tickTockGlobalClock();
      timing.log('tickTockGlobalClock');

      await this.waitForPendingEdits(tick, sessionId);
      timing.log('waitForPendingEdits');

      const { minSourceTick, maxSourceTick } = await getLookupSourceTickRange(
        this.store,
        since,
        tick,
      );
      timing.log('getLookupSourceTickRange');

      await models.SyncSession.update(
        { pullSince: since, pullUntil: tick },
        { where: { id: sessionId } },
      );
      timing.log('updateSyncSessionPullInfo');

      await models.SyncSession.setParameters(sessionId, {
        minSourceTick,
        maxSourceTick,
        tablesForFullResync,
        useSyncLookup: this.constructor.config.sync.lookupTable.enabled,
      });
      timing.log('setSyncSessionParameters');

      const modelsToInclude = tablesToInclude
        ? filterModelsFromName(models, tablesToInclude)
        : models;
      timing.log('filterModelsFromName');

      // work out if any patients were newly marked for sync since this device last connected, and
      // include changes from all time for those patients
      const newPatientFacilitiesCount = await models.PatientFacility.count({
        where: { facilityId: { [Op.in]: facilityIds }, updatedAtSyncTick: { [Op.gt]: since } },
      });
      timing.log('countNewPatientFacilities', { newPatientFacilitiesCount });
      
      log.debug('CentralSyncManager.initiatePull', {
        facilityIds,
        newlyMarkedPatientCount: newPatientFacilitiesCount,
      });

      const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
        sequelize,
        sessionId,
        true,
        facilityIds,
        since,
      );
      timing.log('createFullSyncPatientsTable');

      const incrementalSyncPatientsTable = await createMarkedForSyncPatientsTable(
        sequelize,
        sessionId,
        false,
        facilityIds,
        since,
      );
      timing.log('createIncrementalSyncPatientsTable');

      // query settings table and return true if any facility has set syncAllLabRequests to true
      const [{ syncAllLabRequests }] = await sequelize.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM settings
          WHERE key = 'sync.syncAllLabRequests'
            AND scope = :scope
            AND facility_id IN (:facilityIds)
            AND value = 'true'
        ) AS "syncAllLabRequests"
        `,
        {
          replacements: { facilityIds, scope: SETTINGS_SCOPES.FACILITY },
          type: QueryTypes.SELECT,
        },
      );
      timing.log('querySyncAllLabRequests', { syncAllLabRequests });

      const sessionConfig = {
        // for facilities with a lab, need ongoing lab requests
        // no need for historical ones on initial sync, and no need on mobile
        syncAllLabRequests: syncAllLabRequests && !session.parameters.isMobile && since > -1,
      };

      // snapshot inside a "repeatable read" transaction, so that other changes made while this
      // snapshot is underway aren't included (as this could lead to a pair of foreign records with
      // the child in the snapshot and its parent missing)
      // as the snapshot only contains read queries plus writes to the specific sync snapshot table
      // that it controls, there should be no concurrent update issues :)
      await repeatableReadTransaction(this.store.sequelize, async () => {
        const { snapshotTransactionTimeoutMs } = this.constructor.config.sync;
        if (snapshotTransactionTimeoutMs) {
          transactionTimeout = setTimeout(() => {
            throw new Error(`Snapshot for session ${sessionId} timed out`);
          }, snapshotTransactionTimeoutMs);
        }

        // full changes
        await snapshotOutgoingChanges(
          this.store,
          getPatientLinkedModels(modelsToInclude),
          -1, // for all time, i.e. 0 onwards
          newPatientFacilitiesCount,
          fullSyncPatientsTable,
          sessionId,
          facilityIds,
          deviceId,
          {}, // sending empty session config because this snapshot attempt is only for syncing new marked for sync patients
        );
        timing.logSubAction('repeatableReadTransaction', 'snapshotOutgoingChanges_full');

        // get changes since the last successful sync for all other synced patients and independent
        // record types
        const patientFacilitiesCount = await models.PatientFacility.count({
          where: { facilityId: facilityIds },
        });
        timing.logSubAction('repeatableReadTransaction', 'countPatientFacilities', { patientFacilitiesCount });

        // regular changes
        await snapshotOutgoingChanges(
          this.store,
          getModelsForPull(modelsToInclude),
          since,
          patientFacilitiesCount,
          incrementalSyncPatientsTable,
          sessionId,
          facilityIds,
          deviceId,
          sessionConfig,
        );
        timing.logSubAction('repeatableReadTransaction', 'snapshotOutgoingChanges_incremental');

        // any tables for full resync from (used when mobile needs to wipe and resync tables as
        // part of the upgrade process)
        if (tablesForFullResync) {
          const modelsForFullResync = filterModelsFromName(models, tablesForFullResync);
          await snapshotOutgoingChanges(
            this.store,
            getModelsForPull(modelsForFullResync),
            -1,
            patientFacilitiesCount,
            incrementalSyncPatientsTable,
            sessionId,
            facilityIds,
            deviceId,
            sessionConfig,
          );
          timing.logSubAction('repeatableReadTransaction', 'snapshotOutgoingChanges_fullResync');
        }

        // delete any outgoing changes that were just pushed in during the same session
        await removeEchoedChanges(this.store, sessionId);
        timing.logSubAction('repeatableReadTransaction', 'removeEchoedChanges');
        
        timing.logSubAction('repeatableReadTransaction', 'transactionComplete');
      });
      timing.log('repeatableReadTransaction');
      
      // this update to the session needs to happen outside of the transaction, as the repeatable
      // read isolation level can suffer serialization failures if a record is updated inside and
      // outside the transaction, and the session is being updated to show the last connection
      // time throughout the snapshot process
      await session.update({ snapshotCompletedAt: new Date() });
      timing.log('updateSnapshotCompletedAt');
      
      timing.log('setupSnapshotForPullComplete');
    } catch (error) {
      timing.log('setupSnapshotForPullError', { error: error.message });
      log.error('CentralSyncManager.setupSnapshotForPull encountered an error', {
        sessionId,
        ...error,
      });
      await this.store.models.SyncSession.markSessionErrored(sessionId, error.message);
    } finally {
      if (transactionTimeout) clearTimeout(transactionTimeout);
      await unmarkSessionAsProcessing();
      // Save timing data to debug_info
      await timing.saveTimingsToDebugInfo();
    }
  }

  async checkSessionReady(sessionId) {
    // if this session is still initiating, return false to tell the client to keep waiting
    const sessionIsInitiating = await this.checkSessionIsProcessing(sessionId);
    if (sessionIsInitiating) {
      return false;
    }

    // if this session is not marked as processing, but also never set startedAtTick, record an error
    const session = await this.connectToSession(sessionId);
    if (session.startedAtTick === null) {
      await session.markErrored(
        'Session initiation incomplete, likely because the central server restarted during the process',
      );
      throw new Error(errorMessageFromSession(session));
    }

    // session ready!
    return true;
  }

  async checkPullReady(sessionId) {
    await this.connectToSession(sessionId);

    // if this snapshot still processing, return false to tell the client to keep waiting
    const snapshotIsProcessing = await this.checkSessionIsProcessing(sessionId);
    if (snapshotIsProcessing) {
      return false;
    }

    // if this snapshot is not marked as processing, but also never completed, record an error
    const session = await this.connectToSession(sessionId);
    if (session.snapshotCompletedAt === null) {
      await session.markErrored(
        'Snapshot processing incomplete, likely because the central server restarted during the snapshot',
      );
      throw new Error(errorMessageFromSession(session));
    }

    // snapshot processing complete!
    return true;
  }

  async fetchSyncMetadata(sessionId) {
    // Minimum metadata info for now but can grow in the future
    const { startedAtTick } = await this.connectToSession(sessionId);
    return { startedAtTick };
  }

  async fetchPullMetadata(sessionId) {
    const timing = this.createOperationTiming(sessionId, 'fetchPullMetadata', true); // Assume mobile for performance tracking
    try {
      const session = await this.connectToSession(sessionId);
      timing.log('connectToSession');
      
      const totalToPull = await countSyncSnapshotRecords(
        this.store.sequelize,
        sessionId,
        SYNC_SESSION_DIRECTION.OUTGOING,
      );
      timing.log('countSyncSnapshotRecords', { totalToPull });
      
      await this.store.models.SyncSession.addDebugInfo(sessionId, { totalToPull });
      timing.log('addDebugInfo');
      
      const { pullUntil } = session;
      timing.log('fetchPullMetadataComplete', { totalToPull, pullUntil });
      return { totalToPull, pullUntil };
    } finally {
      // Save timing data to debug_info
      await timing.saveTimingsToDebugInfo();
    }
  }

  async getOutgoingChanges(sessionId, { fromId, limit }) {
    const timing = this.createOperationTiming(sessionId, 'getOutgoingChanges', true); // Assume mobile for performance tracking
    try {
      const session = await this.connectToSession(sessionId);
      timing.log('connectToSession');
      
      const snapshotRecords = await findSyncSnapshotRecords(
        this.store.sequelize,
        sessionId,
        SYNC_SESSION_DIRECTION.OUTGOING,
        fromId,
        limit,
      );
      timing.log('findSyncSnapshotRecords', { 
        recordsCount: snapshotRecords.length, 
        fromId, 
        limit 
      });
      
      const { minSourceTick, maxSourceTick } = session.parameters;
      if (!minSourceTick || !maxSourceTick) {
        timing.log('getOutgoingChangesComplete_noChangelog');
        return snapshotRecords;
      }

      const recordsForPull = await attachChangelogToSnapshotRecords(this.store, snapshotRecords, {
        minSourceTick,
        maxSourceTick,
      });
      timing.log('attachChangelogToSnapshotRecords');
      
      timing.log('getOutgoingChangesComplete_withChangelog');
      return recordsForPull;
    } finally {
      // Save timing data to debug_info
      await timing.saveTimingsToDebugInfo();
    }
  }

  async persistIncomingChanges(sessionId, deviceId, tablesToInclude, isMobile) {
    const timing = this.createOperationTiming(sessionId, 'persistIncomingChanges', isMobile);
    const { sequelize, models } = this.store;
    
    const totalPushed = await countSyncSnapshotRecords(
      sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.INCOMING,
    );
    timing.log('countSyncSnapshotRecords', { totalPushed });
    
    await models.SyncSession.addDebugInfo(sessionId, { beganPersistAt: new Date(), totalPushed });

    const modelsToInclude = tablesToInclude
      ? filterModelsFromName(models, tablesToInclude)
      : getModelsForPush(models);
    timing.log('filterModelsForPush');

    try {
      // commit the changes to the db
      const persistedAtSyncTick = await sequelize.transaction(async () => {
        // currently we do not create audit logs on mobile devices
        // so we rely on sync process to create audit logs
        if (!isMobile) {
          await pauseAudit(sequelize);
          timing.logSubAction('sequelizeTransaction', 'pauseAudit');
        }
        
        // we tick-tock the global clock to make sure there is a unique tick for these changes
        // n.b. this used to also be used for concurrency control, but that is now handled by
        // shared advisory locks taken using the current sync tick as the id, which are waited on
        // by an exclusive lock taken prior to starting a snapshot - so this is now purely for
        // saving with a unique tick
        const { tock } = await this.tickTockGlobalClock();
        timing.logSubAction('sequelizeTransaction', 'tickTockGlobalClock');

        // run any side effects for each model
        // eg: resolving duplicated patient display IDs
        await incomingSyncHook(sequelize, modelsToInclude, sessionId);
        timing.logSubAction('sequelizeTransaction', 'incomingSyncHook');

        await saveIncomingChanges(sequelize, modelsToInclude, sessionId, true);
        timing.logSubAction('sequelizeTransaction', 'saveIncomingChanges');
        
        // store the sync tick on save with the incoming changes, so they can be compared for
        // edits with the outgoing changes
        await updateSnapshotRecords(
          sequelize,
          sessionId,
          { savedAtSyncTick: tock },
          { direction: SYNC_SESSION_DIRECTION.INCOMING },
        );
        timing.logSubAction('sequelizeTransaction', 'updateSnapshotRecords');

        // Tick tock once more to ensure that no records that are subsequently modified will share the same sync tick as the incoming changes
        // notably so that if records are modified by adjustDataPostSyncPush(), they will be picked up for pulling in the same session
        // (specifically won't be removed by removeEchoedChanges())
        await this.tickTockGlobalClock();
        timing.logSubAction('sequelizeTransaction', 'tickTockGlobalClock_second');

        timing.logSubAction('sequelizeTransaction', 'transactionComplete');
        return tock;
      });
      timing.log('sequelizeTransaction');

      await models.SyncDeviceTick.create({
        deviceId,
        persistedAtSyncTick,
      });
      timing.log('createSyncDeviceTick');
      
      await adjustDataPostSyncPush(sequelize, modelsToInclude, sessionId);
      timing.log('adjustDataPostSyncPush');

      // mark for repull any records that were modified by an incoming sync hook
      await bumpSyncTickForRepull(sequelize, modelsToInclude, sessionId);
      timing.log('bumpSyncTickForRepull');

      // mark persisted so that client polling "completePush" can stop
      await models.SyncSession.update(
        { persistCompletedAt: new Date() },
        { where: { id: sessionId } },
      );
      timing.log('updatePersistCompletedAt');

      // WARNING: if you are adding another db call here, you need to either move the
      // persistCompletedAt lower down, or change the check in checkPushComplete
      
      timing.log('persistIncomingChangesComplete');
    } catch (error) {
      timing.log('persistIncomingChangesError', { error: error.message });
      log.error('CentralSyncManager.persistIncomingChanges encountered an error', error);
      await models.SyncSession.markSessionErrored(sessionId, error.message);
    } finally {
      // Save timing data to debug_info
      await timing.saveTimingsToDebugInfo();
    }
  }

  async addIncomingChanges(sessionId, changes) {
    const timing = this.createOperationTiming(sessionId, 'addIncomingChanges', true); // Assume mobile for performance tracking
    try {
      const { sequelize } = this.store;
      
      await this.connectToSession(sessionId);
      timing.log('connectToSession');
      
      const incomingSnapshotRecords = changes.map((c) => ({
        ...c,
        direction: SYNC_SESSION_DIRECTION.INCOMING,
        updatedAtByFieldSum: c.data.updatedAtByField
          ? Object.values(c.data.updatedAtByField).reduce((s, v) => s + v)
          : null,
      }));
      timing.log('mapIncomingSnapshotRecords', { changesCount: changes.length });

      log.debug('CentralSyncManager.addIncomingChanges', {
        incomingSnapshotRecordsCount: incomingSnapshotRecords.length,
        sessionId,
      });

      await insertSnapshotRecords(sequelize, sessionId, incomingSnapshotRecords);
      timing.log('insertSnapshotRecords');
      
      timing.log('addIncomingChangesComplete');
    } finally {
      // Save timing data to debug_info
      await timing.saveTimingsToDebugInfo();
    }
  }

  async completePush(sessionId, deviceId, tablesToInclude) {
    const timing = this.createOperationTiming(sessionId, 'completePush', true); // Assume mobile for performance tracking
    try {
      const session = await this.connectToSession(sessionId);
      timing.log('connectToSession');

      // don't await persisting, the client should asynchronously poll as it may take longer than
      // the http request timeout
      const unmarkSessionAsProcessing = await this.markSessionAsProcessing(sessionId);
      timing.log('markSessionAsProcessing');
      
      this.persistIncomingChanges(
        sessionId,
        deviceId,
        tablesToInclude,
        session.parameters.isMobile,
      ).finally(unmarkSessionAsProcessing);
      timing.log('persistIncomingChangesStarted');
      
      timing.log('completePushComplete');
    } finally {
      // Save timing data to debug_info
      await timing.saveTimingsToDebugInfo();
    }
  }

  async checkPushComplete(sessionId) {
    // if the push is still persisting, return false to tell the client to keep waiting
    const persistIsProcessing = await this.checkSessionIsProcessing(sessionId);
    if (persistIsProcessing) {
      return false;
    }

    // if this session is not marked as processing, but also never set persistCompletedAt, record an error
    const session = await this.connectToSession(sessionId);
    if (session.persistCompletedAt === null) {
      await session.markErrored(
        'Push persist incomplete, likely because the central server restarted during the process',
      );
      throw new Error(errorMessageFromSession(session));
    }

    // push complete!
    return true;
  }
}
