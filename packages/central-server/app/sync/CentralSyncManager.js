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
  const routes = new Map(); // Track all routes in this session (top level)
  
  return {
    createRouteTimer: (routeName, isMobile = false) => {
      const routeStartTime = Date.now();
      const timing = createTimingLogger(routeName, sessionId, isMobile, store);
      
      // Initialize route entry if it doesn't exist
      if (!routes.has(routeName)) {
        routes.set(routeName, {
          routeName,
          isMobile,
          startTime: routeStartTime,
          endTime: null,
          benchmarkData: null,
          operations: new Map(), // Operations nested under this route
        });
      }
      
      // Override the saveTimingsToDebugInfo to only aggregate into session-wide benchmark
      timing.saveTimingsToDebugInfo = async function(additionalData = {}) {
        const benchmarkData = this.getBenchmarkData();
        const routeEntry = routes.get(routeName);
        
        // Update route with final timing data
        routeEntry.endTime = Date.now();
        routeEntry.benchmarkData = benchmarkData;
        routeEntry.additionalData = additionalData;
        
        // Convert route actions to operations format
        routeEntry.routeOperations = benchmarkData.actions.map(action => ({
          name: action.name,
          totalDurationMs: action.durationMs, // durationMs contains the totalDurationMs value
          ...(action.callCount > 1 && { 
            callCount: action.callCount,
            averageDurationMs: action.averageDurationMs 
          }),
          ...(action.subActions && action.subActions.length > 0 && {
            actions: action.subActions.map(sa => ({
              name: sa.name,
              durationMs: sa.durationMs,
              ...(sa.callCount > 1 && { 
                callCount: sa.callCount,
                averageDurationMs: sa.averageDurationMs 
              }),
            }))
          })
        }));
        
        // Don't save individual route benchmarks - only collect for final session benchmark
      };
      
      return timing;
    },
    
    createOperationTimer: (operation, isMobile = false, routeName = null) => {
      const operationStartTime = Date.now();
      const timing = createTimingLogger(operation, sessionId, isMobile, store);
      
      // Override the saveTimingsToDebugInfo to only aggregate into session-wide benchmark
      timing.saveTimingsToDebugInfo = async function(additionalData = {}) {
        const benchmarkData = this.getBenchmarkData();
        
        if (routeName && routes.has(routeName)) {
          // Nest this operation under the specified route
          const routeEntry = routes.get(routeName);
          routeEntry.operations.set(operation, {
            operation,
            isMobile,
            startTime: operationStartTime,
            endTime: Date.now(),
            ...benchmarkData,
            ...additionalData,
          });
        }
        
        // Don't save individual operation benchmarks - only collect for final session benchmark
      };
      
      return timing;
    },
    
    // Method to finalize and save the complete session benchmark
    finalizeSession: async () => {
      if (!store || !sessionId) return;
      
      const sessionEndTime = Date.now();
      const sessionTotalDuration = sessionEndTime - sessionStartTime;
      
      // Create final aggregated benchmark with routes containing nested operations
      const allRoutes = [];
      let totalOperationCount = 0;
      
      // Process routes with their nested operations
      routes.forEach((routeEntry) => {
        const allOperations = [];
        
        // Add route-level operations (actions from the route itself)
        if (routeEntry.routeOperations) {
          allOperations.push(...routeEntry.routeOperations);
          totalOperationCount += routeEntry.routeOperations.length;
        }
        
        // Add CentralSyncManager operations nested under this route
        routeEntry.operations.forEach((opData) => {
          allOperations.push({
            name: opData.operation,
            startTime: new Date(opData.startTime).toISOString(),
            endTime: new Date(opData.endTime).toISOString(),
            totalDurationMs: opData.grandTotal.totalDurationMs,
            actions: opData.actions,
          });
          totalOperationCount++;
        });
        
        // Add route with its nested operations
        if (routeEntry.benchmarkData) {
          allRoutes.push({
            name: routeEntry.routeName,
            startTime: new Date(routeEntry.startTime).toISOString(),
            endTime: new Date(routeEntry.endTime).toISOString(),
            totalDurationMs: routeEntry.benchmarkData.grandTotal.totalDurationMs,
            operations: allOperations, // All operations (route + sync manager)
          });
        }
      });
      
      const benchmark = {
        totalDurationMs: sessionTotalDuration,
        routes: allRoutes,
      };
      
      try {
        await store.models.SyncSession.addDebugInfo(sessionId, {
          benchmark,
        });
        log.info('CentralSyncManager.benchmark.saved', {
          sessionId,
          totalDurationMs: sessionTotalDuration,
          routeCount: allRoutes.length,
          operationCount: totalOperationCount,
        });
      } catch (error) {
        log.error('CentralSyncManager.benchmark.error', {
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
const createTimingLogger = (operation, sessionId, isMobile = false) => {
  const startTime = Date.now();
  const startDate = new Date(startTime);
  const actions = new Map(); // Track actions and their subactions
  const actionLogs = []; // Track individual action logs with timestamps
  let lastActionTime = startTime; // Track time for individual action durations
  
  return {
    log: (action, additionalData = {}) => {
      const currentTime = Date.now();
      const actionDuration = Math.max(1, currentTime - lastActionTime); // Minimum 1ms to avoid zeros
      
      // Create or update action entry
      if (!actions.has(action)) {
        actions.set(action, {
          name: action,
          totalDurationMs: 0,
          callCount: 0,
          subActions: [],
        });
      }
      
      const actionEntry = actions.get(action);
      actionEntry.totalDurationMs += actionDuration;
      actionEntry.callCount += 1;
      lastActionTime = currentTime;
      
      // Store individual log entry
      const logEntry = {
        action,
        timestamp: new Date(currentTime).toISOString(),
        durationMs: actionDuration,
        totalDurationMs: currentTime - startTime,
        ...additionalData,
      };
      actionLogs.push(logEntry);
      
      log.debug('CentralSyncManager.timing', {
        operation,
        action,
        sessionId,
        isMobile,
        durationMs: actionDuration,
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
        const actionInfo = {
          name: actionName,
          durationMs: actionData.totalDurationMs,
        };
        
        // Only include callCount if it's more than 1
        if (actionData.callCount > 1) {
          actionInfo.callCount = actionData.callCount;
          actionInfo.averageDurationMs = actionData.totalDurationMs / actionData.callCount;
        }
        
        // Only include subActions if they exist
        if (actionData.subActions.length > 0) {
          actionInfo.subActions = actionData.subActions.map(sa => ({
            name: sa.name,
            durationMs: sa.totalDurationMs,
            ...(sa.callCount > 1 && { 
              callCount: sa.callCount,
              averageDurationMs: sa.totalDurationMs / sa.callCount 
            }),
          }));
        }
        
        actionsArray.push(actionInfo);
      });
      
      return {
        grandTotal: {
          totalDurationMs: totalDuration,
          totalActionCalls: actionsArray.reduce((sum, action) => sum + action.callCount, 0),
        },
        actions: actionsArray,
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
    
    saveTimingsToDebugInfo: async function() {
      // Individual operation benchmarks are no longer saved - only collected for final session benchmark
      // This method is kept for compatibility but does nothing
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
  createOperationTiming(sessionId, operation, isMobile = false, routeName = null) {
    if (!sessionId) return null; // Don't benchmark if no sessionId
    const sessionAggregator = this.getSessionTimingAggregator(sessionId);
    return sessionAggregator.createOperationTimer(operation, isMobile, routeName);
  }
  
  // Create route-level timing (top level in hierarchy)
  createRouteTiming(sessionId, routeName, isMobile = false) {
    if (!sessionId) return null; // Don't benchmark if no sessionId
    const sessionAggregator = this.getSessionTimingAggregator(sessionId);
    return sessionAggregator.createRouteTimer(routeName, isMobile);
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
    const timing = this.createOperationTiming(sessionId, 'Start Session', isMobile);
          timing.log('Generate Session ID');
    
    const startTime = new Date();
    const parameters = { deviceId, facilityIds, isMobile };

    const unmarkSessionAsProcessing = await this.markSessionAsProcessing(sessionId);
    timing.log('Mark Session as Processing');
    
    const syncSession = await this.store.models.SyncSession.create({
      id: sessionId,
      startTime,
      lastConnectionTime: startTime,
      debugInfo,
      parameters,
    });
    timing.log('Create Sync Session');

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
    const timing = this.createOperationTiming(syncSession.id, 'Prepare Session', syncSession.parameters?.isMobile);
    
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

  async endSession(sessionId, routeName = null) {
    const timing = this.createOperationTiming(sessionId, 'End Session', false, routeName);
    
    try {
      const session = await this.connectToSession(sessionId);
      if (timing) timing.log('connectToSession');
      
      const durationMs = Date.now() - session.startTime;
      log.debug('CentralSyncManager.completingSession', { sessionId, durationMs });
      
      await completeSyncSession(this.store, sessionId);
      if (timing) timing.log('completeSyncSession');
      
      log.info('CentralSyncManager.completedSession', {
        sessionId,
        durationMs,
        facilityIds: session.parameters.facilityIds,
        deviceId: session.parameters.deviceId,
      });
      
      if (timing) timing.log('endSessionComplete');
    } finally {
      // Save the endSession operation timing
      if (timing) await timing.saveTimingsToDebugInfo();
    }
  }
  
  // Separate method to finalize session benchmarks - called from route after all timings are saved
  async finalizeSessionBenchmark(sessionId) {
    const sessionAggregator = this.sessionTimingAggregators.get(sessionId);
    if (sessionAggregator) {
      await sessionAggregator.finalizeSession();
      this.sessionTimingAggregators.delete(sessionId);
    }
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
  async initiatePull(sessionId, params, routeName = null) {
    const timing = this.createOperationTiming(sessionId, 'Initiate Pull', params?.isMobile, routeName);
    
    try {
      await this.connectToSession(sessionId);
      if (timing) timing.log('connectToSession');

      // first check if the snapshot is already being processed, to throw a sane error if (for some
      // reason) the client managed to kick off the pull twice (ran into this in v1.24.0 and v1.24.1)
      const isAlreadyProcessing = await this.checkSessionIsProcessing(sessionId);
      if (timing) timing.log('checkSessionIsProcessing');
      
      if (isAlreadyProcessing) {
        throw new Error(`Snapshot for session ${sessionId} is already being processed`);
      }

      const unmarkSessionAsProcessing = await this.markSessionAsProcessing(sessionId);
      if (timing) timing.log('markSessionAsProcessing');
      
      this.setupSnapshotForPull(sessionId, params, unmarkSessionAsProcessing); // don't await, as it takes a while - the sync client will poll for it to finish
      if (timing) timing.log('setupSnapshotForPullStarted');
    } catch (error) {
      if (timing) timing.log('initiatePullError', { error: error.message });
      log.error('CentralSyncManager.initiatePull encountered an error', error);
      await this.store.models.SyncSession.markSessionErrored(sessionId, error.message);
    } finally {
      // Save timing data to debug_info
      if (timing) await timing.saveTimingsToDebugInfo();
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
    const timing = sessionId && this.createOperationTiming(sessionId, 'Wait for Pending Edits', true); // Assume mobile for performance tracking
    
    // get all the ticks (ie: keys of in-flight transaction advisory locks) of previously pending edits
    const pendingSyncTicks = (await getSyncTicksOfPendingEdits(this.store.sequelize)).filter(
      (t) => t < tick,
    );
    if (timing) {
    timing.log('getSyncTicksOfPendingEdits', { 
        pendingSyncTicksCount: pendingSyncTicks.length,
        tick 
      });
    }

    // wait for any in-flight transactions of pending edits
    // that we don't miss any changes that are in progress
    await Promise.all(
      pendingSyncTicks.map((t) => waitForPendingEditsUsingSyncTick(this.store.sequelize, t)),
    );
    if (timing) { 
      timing.log('waitForPendingEditsComplete');
    }
  }

  async setupSnapshotForPull(
    sessionId,
    { since, facilityIds, tablesToInclude, tablesForFullResync, deviceId },
    unmarkSessionAsProcessing,
  ) {
    const timing = this.createOperationTiming(sessionId, 'Setup Snapshot for Pull', true); // Assume mobile for performance tracking
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

  async checkSessionReady(sessionId, routeName = null) {
    const timing = this.createOperationTiming(sessionId, 'Check Session Ready', false, routeName);
    
    try {
      // if this session is still initiating, return false to tell the client to keep waiting
      const sessionIsInitiating = await this.checkSessionIsProcessing(sessionId);
      if (timing) timing.log('checkSessionIsProcessing');
      
      if (sessionIsInitiating) {
        if (timing) timing.log('sessionStillInitiating');
        return false;
      }

      // if this session is not marked as processing, but also never set startedAtTick, record an error
      const session = await this.connectToSession(sessionId);
      if (timing) timing.log('connectToSession');
      
      if (session.startedAtTick === null) {
        if (timing) timing.log('sessionErrorNoStartedAtTick');
        await session.markErrored(
          'Session initiation incomplete, likely because the central server restarted during the process',
        );
        throw new Error(errorMessageFromSession(session));
      }

      // session ready!
      if (timing) timing.log('sessionReady');
      return true;
    } finally {
      if (timing) await timing.saveTimingsToDebugInfo();
    }
  }

  async checkPullReady(sessionId, routeName = null) {
    const timing = this.createOperationTiming(sessionId, 'Check Pull Ready', false, routeName);
    
    try {
      await this.connectToSession(sessionId);
      if (timing) timing.log('connectToSession');

      // if this snapshot still processing, return false to tell the client to keep waiting
      const snapshotIsProcessing = await this.checkSessionIsProcessing(sessionId);
      if (timing) timing.log('checkSessionIsProcessing');
      
      if (snapshotIsProcessing) {
        if (timing) timing.log('snapshotStillProcessing');
        return false;
      }

      // if this snapshot is not marked as processing, but also never completed, record an error
      const session = await this.connectToSession(sessionId);
      if (timing) timing.log('connectToSessionAgain');
      
      if (session.snapshotCompletedAt === null) {
        if (timing) timing.log('snapshotErrorNotCompleted');
        await session.markErrored(
          'Snapshot processing incomplete, likely because the central server restarted during the snapshot',
        );
        throw new Error(errorMessageFromSession(session));
      }

      // snapshot processing complete!
      if (timing) timing.log('snapshotReady');
      return true;
    } finally {
      if (timing) await timing.saveTimingsToDebugInfo();
    }
  }

  async fetchSyncMetadata(sessionId, routeName = null) {
    const timing = this.createOperationTiming(sessionId, 'Fetch Sync Metadata', false, routeName);
    
    try {
      // Minimum metadata info for now but can grow in the future
      const { startedAtTick } = await this.connectToSession(sessionId);
      if (timing) timing.log('connectToSession');
      
      if (timing) timing.log('fetchMetadataComplete');
      return { startedAtTick };
    } finally {
      if (timing) await timing.saveTimingsToDebugInfo();
    }
  }

  async fetchPullMetadata(sessionId, routeName = null) {
    const timing = this.createOperationTiming(sessionId, 'Fetch Pull Metadata', true, routeName); // Assume mobile for performance tracking
    try {
      const session = await this.connectToSession(sessionId);
      if (timing) timing.log('connectToSession');
      
      const totalToPull = await countSyncSnapshotRecords(
        this.store.sequelize,
        sessionId,
        SYNC_SESSION_DIRECTION.OUTGOING,
      );
      if (timing) timing.log('countSyncSnapshotRecords', { totalToPull });
      
      await this.store.models.SyncSession.addDebugInfo(sessionId, { totalToPull });
      if (timing) timing.log('addDebugInfo');
      
      const { pullUntil } = session;
      if (timing) timing.log('fetchPullMetadataComplete', { totalToPull, pullUntil });
      return { totalToPull, pullUntil };
    } finally {
      // Save timing data to debug_info
      if (timing) await timing.saveTimingsToDebugInfo();
    }
  }

  async getOutgoingChanges(sessionId, { fromId, limit }, routeName = null) {
    const timing = this.createOperationTiming(sessionId, 'Get Outgoing Changes', true, routeName); // Assume mobile for performance tracking
    try {
      const session = await this.connectToSession(sessionId);
      if (timing) timing.log('connectToSession');
      
      const snapshotRecords = await findSyncSnapshotRecords(
        this.store.sequelize,
        sessionId,
        SYNC_SESSION_DIRECTION.OUTGOING,
        fromId,
        limit,
      );
      if (timing) timing.log('findSyncSnapshotRecords', { 
        recordsCount: snapshotRecords.length, 
        fromId, 
        limit 
      });
      
      const { minSourceTick, maxSourceTick } = session.parameters;
      if (!minSourceTick || !maxSourceTick) {
        if (timing) timing.log('getOutgoingChangesComplete_noChangelog');
        return snapshotRecords;
      }

      const recordsForPull = await attachChangelogToSnapshotRecords(this.store, snapshotRecords, {
        minSourceTick,
        maxSourceTick,
      });
      if (timing) timing.log('attachChangelogToSnapshotRecords');
      
      if (timing) timing.log('getOutgoingChangesComplete_withChangelog');
      return recordsForPull;
    } finally {
      // Save timing data to debug_info
      if (timing) await timing.saveTimingsToDebugInfo();
    }
  }

  async persistIncomingChanges(sessionId, deviceId, tablesToInclude, isMobile) {
    const timing = this.createOperationTiming(sessionId, 'Persist Incoming Changes', isMobile);
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

  async addIncomingChanges(sessionId, changes, routeName = null) {
    const timing = this.createOperationTiming(sessionId, 'Add Incoming Changes', true, routeName); // Assume mobile for performance tracking
    try {
      const { sequelize } = this.store;
      
      await this.connectToSession(sessionId);
      if (timing) timing.log('connectToSession');
      
      const incomingSnapshotRecords = changes.map((c) => ({
        ...c,
        direction: SYNC_SESSION_DIRECTION.INCOMING,
        updatedAtByFieldSum: c.data.updatedAtByField
          ? Object.values(c.data.updatedAtByField).reduce((s, v) => s + v)
          : null,
      }));
      if (timing) timing.log('mapIncomingSnapshotRecords', { changesCount: changes.length });

      log.debug('CentralSyncManager.addIncomingChanges', {
        incomingSnapshotRecordsCount: incomingSnapshotRecords.length,
        sessionId,
      });

      await insertSnapshotRecords(sequelize, sessionId, incomingSnapshotRecords);
      if (timing) timing.log('insertSnapshotRecords');
      
      if (timing) timing.log('addIncomingChangesComplete');
    } finally {
      // Save timing data to debug_info
      if (timing) await timing.saveTimingsToDebugInfo();
    }
  }

  async completePush(sessionId, deviceId, tablesToInclude, routeName = null) {
    const timing = this.createOperationTiming(sessionId, 'Complete Push', true, routeName); // Assume mobile for performance tracking
    try {
      const session = await this.connectToSession(sessionId);
      if (timing) timing.log('connectToSession');

      // don't await persisting, the client should asynchronously poll as it may take longer than
      // the http request timeout
      const unmarkSessionAsProcessing = await this.markSessionAsProcessing(sessionId);
      if (timing) timing.log('markSessionAsProcessing');
      
      this.persistIncomingChanges(
        sessionId,
        deviceId,
        tablesToInclude,
        session.parameters.isMobile,
      ).finally(unmarkSessionAsProcessing);
      if (timing) timing.log('persistIncomingChangesStarted');
      
      if (timing) timing.log('completePushComplete');
    } finally {
      // Save timing data to debug_info
      if (timing) await timing.saveTimingsToDebugInfo();
    }
  }

  async checkPushComplete(sessionId, routeName = null) {
    const timing = this.createOperationTiming(sessionId, 'Check Push Complete', false, routeName);
    
    try {
      // if the push is still persisting, return false to tell the client to keep waiting
      const persistIsProcessing = await this.checkSessionIsProcessing(sessionId);
      if (timing) timing.log('checkSessionIsProcessing');
      
      if (persistIsProcessing) {
        if (timing) timing.log('persistStillProcessing');
        return false;
      }

      // if this session is not marked as processing, but also never set persistCompletedAt, record an error
      const session = await this.connectToSession(sessionId);
      if (timing) timing.log('connectToSession');
      
      if (session.persistCompletedAt === null) {
        if (timing) timing.log('persistErrorNotCompleted');
        await session.markErrored(
          'Push persist incomplete, likely because the central server restarted during the process',
        );
        throw new Error(errorMessageFromSession(session));
      }

      // push complete!
      if (timing) timing.log('pushComplete');
      return true;
    } finally {
      if (timing) await timing.saveTimingsToDebugInfo();
    }
  }
}
