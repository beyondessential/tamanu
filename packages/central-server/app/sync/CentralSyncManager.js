import { trace } from '@opentelemetry/api';
import { Op, QueryTypes } from 'sequelize';
import _config from 'config';
import { isNil } from 'lodash';

import { DEBUG_LOG_TYPES, SETTINGS_SCOPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { log } from '@tamanu/shared/services/logging';
import {
  adjustDataPostSyncPush,
  bumpSyncTickForRepull,
  incomingSyncHook,
  completeSyncSession,
  countSyncSnapshotRecords,
  createSnapshotTable,
  findSyncSnapshotRecordsOrderByDependency,
  getModelsForPull,
  getModelsForPush,
  getSyncTicksOfPendingEdits,
  insertSnapshotRecords,
  vacuumAnalyzeSnapshotTable,
  removeEchoedChanges,
  saveIncomingChanges,
  updateSnapshotRecords,
  waitForPendingEditsUsingSyncTick,
  repeatableReadTransaction,
  SYNC_SESSION_DIRECTION,
  SYNC_TICK_FLAGS,
} from '@tamanu/database/sync';
import { attachChangelogToSnapshotRecords, pauseAudit } from '@tamanu/database/utils/audit';
import { stringToStableInteger, uuidToFairlyUniqueInteger } from '@tamanu/shared/utils';

import { getLookupSourceTickRange } from './getLookupSourceTickRange';
import { getPatientLinkedModels } from './getPatientLinkedModels';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';
import { filterModelsFromName } from './filterModelsFromName';
import { startSnapshotWhenCapacityAvailable } from './startSnapshotWhenCapacityAvailable';
import { createMarkedForSyncPatientsTable } from './createMarkedForSyncPatientsTable';
import { updateLookupTable, updateSyncLookupPendingRecords } from './updateLookupTable';

const errorMessageFromSession = session =>
  `Sync session '${session.id}' encountered an error: ${session.errors[session.errors.length - 1]}`;

const CREATE_SESSION_ADVISORY_LOCK = stringToStableInteger('createSessionAdvisoryLock');

// about variables lapsedSessionSeconds and lapsedSessionCheckFrequencySeconds:
// after x minutes of no activity, consider a session lapsed and wipe it to avoid holding invalid
// changes in the database when a sync fails on the facility server end

/**
 * @typedef {import('../ApplicationContext').ApplicationContext} ApplicationContext
 */

export class CentralSyncManager {
  static config = _config;

  static overrideConfig(override) {
    this.config = override;
  }

  static restoreConfig() {
    this.config = _config;
  }

  currentSyncTick;

  /** @type {ApplicationContext} */
  store;

  purgeInterval;

  constructor(ctx) {
    this.store = ctx.store;
    ctx.onClose(this.close);
  }

  close = () => clearInterval(this.purgeInterval);

  /**
   * We use this lock to ensure that we can't create multiple sessions at the same time.
   * This avoids situations where we unintentionally exceed the maxConcurrentSessions limit.
   *
   * Uses a transaction level advisory lock, so ensure that the session is created in the same transaction.
   * @returns {Promise<boolean>} true if lock was acquired, false otherwise
   */
  async takeCreateSessionLock() {
    const [[row]] = await this.store.sequelize.query(
      'SELECT pg_try_advisory_xact_lock(:lockId) AS acquired;',
      {
        replacements: { lockId: CREATE_SESSION_ADVISORY_LOCK },
      },
    );
    return row?.acquired ?? false;
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
    const startTime = new Date();
    const parameters = { deviceId, facilityIds, isMobile };

    const unmarkSessionAsProcessing = await this.markSessionAsProcessing(sessionId);
    let syncSession;
    try {
      syncSession = await this.store.models.SyncSession.create({
        id: sessionId,
        startTime,
        lastConnectionTime: startTime,
        debugInfo,
        parameters,
      });
    } catch (error) {
      // If the session creation fails, we need to release the lock otherwise it will hold up
      // an open connection until the application restarts
      await unmarkSessionAsProcessing();
      const wrappedError = new Error(
        `Failed to create sync session, server may be overloaded with sync requests: ${error.message}`,
      );
      wrappedError.stack = error.stack; // Preserve the original stack trace
      throw wrappedError;
    }

    // no await as prepare session (especially the tickTockGlobalClock action) might get blocked
    // and take a while if the central server is concurrently persisting records from another client.
    // Client should poll for the result later.
    const preparation = this.prepareSession(syncSession).finally(unmarkSessionAsProcessing);

    // ...but in unit tests, the tests interfere with each other if we leave prepares running
    // in the background! So, allow overriding the above behaviour.
    if (this.constructor.config.sync.awaitPreparation) {
      await preparation;
    }

    log.info('CentralSyncManager.startSession', {
      sessionId: syncSession.id,
      ...parameters,
      ...debugInfo,
    });

    return { sessionId: syncSession.id };
  }

  async prepareSession(syncSession) {
    try {
      // if the sync_lookup table is enabled, don't allow syncs until it has finished its first update run
      const syncLookupUpToTick =
        await this.store.models.LocalSystemFact.get(FACT_LOOKUP_UP_TO_TICK);
      if (this.constructor.config.sync.lookupTable.enabled && isNil(syncLookupUpToTick)) {
        throw new Error(`Sync lookup table has not yet built. Cannot initiate sync.`);
      }

      await createSnapshotTable(this.store.sequelize, syncSession.id);
      const { tick } = await this.tickTockGlobalClock();
      await syncSession.markAsStartedAt(tick);

      // eslint-disable-next-line no-unused-expressions
      trace.getActiveSpan()?.setAttributes({
        'app.sync.sessionId': syncSession.id,
        'app.sync.tick': tick,
      });

      return { sessionId: syncSession.id, tick };
    } catch (error) {
      log.error('CentralSyncManager.prepareSession encountered an error', error);
      await this.store.models.SyncSession.markSessionErrored(syncSession.id, error.message);
    }
  }

  async sessionExists(sessionId) {
    const session = await this.store.sequelize.models.SyncSession.findOne({
      where: { id: sessionId },
    });

    return Boolean(session);
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

  async endSession(sessionId, error) {
    const session = await this.connectToSession(sessionId);
    const durationMs = Date.now() - session.startTime;
    log.debug('CentralSyncManager.completingSession', { sessionId, durationMs });
    await completeSyncSession(this.store, sessionId, error);
    if (error) {
      log.error('CentralSyncManager.completedSession with error', {
        sessionId,
        facilityIds: session.parameters.facilityIds,
        deviceId: session.parameters.deviceId,
        durationMs,
        error,
      });
    } else {
      log.info('CentralSyncManager.completedSession', {
        sessionId,
        durationMs,
        facilityIds: session.parameters.facilityIds,
        deviceId: session.parameters.deviceId,
      });
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
  async initiatePull(sessionId, params) {
    try {
      await this.connectToSession(sessionId);

      // first check if the snapshot is already being processed, to throw a sane error if (for some
      // reason) the client managed to kick off the pull twice (ran into this in v1.24.0 and v1.24.1)
      const isAlreadyProcessing = await this.checkSessionIsProcessing(sessionId);
      if (isAlreadyProcessing) {
        throw new Error(`Snapshot for session ${sessionId} is already being processed`);
      }

      const unmarkSessionAsProcessing = await this.markSessionAsProcessing(sessionId);
      this.setupSnapshotForPull(sessionId, params, unmarkSessionAsProcessing); // don't await, as it takes a while - the sync client will poll for it to finish
    } catch (error) {
      log.error('CentralSyncManager.initiatePull encountered an error', error);
      await this.store.models.SyncSession.markSessionErrored(sessionId, error.message);
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

      await repeatableReadTransaction(store.sequelize, async transaction => {
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
          this.store.models,
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

  async waitForPendingEdits(tick) {
    // get all the ticks (ie: keys of in-flight transaction advisory locks) of previously pending edits
    const pendingSyncTicks = (await getSyncTicksOfPendingEdits(this.store.sequelize)).filter(
      t => t < tick,
    );

    // wait for any in-flight transactions of pending edits
    // that we don't miss any changes that are in progress
    await Promise.all(
      pendingSyncTicks.map(t => waitForPendingEditsUsingSyncTick(this.store.sequelize, t)),
    );
  }

  async setupSnapshotForPull(
    sessionId,
    { since, facilityIds, tablesToInclude, tablesForFullResync, deviceId },
    unmarkSessionAsProcessing,
  ) {
    let transactionTimeout;
    try {
      const { models, sequelize } = this.store;

      const session = await this.connectToSession(sessionId);

      // will wait for concurrent snapshots to complete if we are currently at capacity, then
      // set the snapshot_started_at timestamp before we proceed with the heavy work below
      await startSnapshotWhenCapacityAvailable(sequelize, sessionId);

      // get a sync tick that we can safely consider the snapshot to be up to (because we use the
      // "tick" of the tick-tock, so we know any more changes on the server, even while the snapshot
      // process is ongoing, will have a later updated_at_sync_tick)
      const { tick } = await this.tickTockGlobalClock();

      await this.waitForPendingEdits(tick);

      const { minSourceTick, maxSourceTick } = await getLookupSourceTickRange(
        this.store,
        since,
        tick,
      );

      await models.SyncSession.update(
        { pullSince: since, pullUntil: tick },
        { where: { id: sessionId } },
      );

      await models.SyncSession.setParameters(sessionId, {
        minSourceTick,
        maxSourceTick,
        tablesForFullResync,
        useSyncLookup: this.constructor.config.sync.lookupTable.enabled,
      });

      const modelsToInclude = tablesToInclude
        ? filterModelsFromName(models, tablesToInclude)
        : models;

      // work out if any patients were newly marked for sync since this device last connected, and
      // include changes from all time for those patients
      const newPatientFacilitiesCount = await models.PatientFacility.count({
        where: { facilityId: { [Op.in]: facilityIds }, updatedAtSyncTick: { [Op.gt]: since } },
      });
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

      const incrementalSyncPatientsTable = await createMarkedForSyncPatientsTable(
        sequelize,
        sessionId,
        false,
        facilityIds,
        since,
      );

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

        // get changes since the last successful sync for all other synced patients and independent
        // record types
        const patientFacilitiesCount = await models.PatientFacility.count({
          where: { facilityId: facilityIds },
        });

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
        }

        // delete any outgoing changes that were just pushed in during the same session
        await removeEchoedChanges(this.store, sessionId);
      });
      // after snapshotting inserts are done and the transaction is closed, run VACUUM (ANALYZE)
      // to mark pages all-visible and refresh stats so pulls use index-only scans
      await vacuumAnalyzeSnapshotTable(this.store.sequelize, sessionId);
      // this update to the session needs to happen outside of the transaction, as the repeatable
      // read isolation level can suffer serialization failures if a record is updated inside and
      // outside the transaction, and the session is being updated to show the last connection
      // time throughout the snapshot process
      await session.update({ snapshotCompletedAt: new Date() });
    } catch (error) {
      log.error('CentralSyncManager.setupSnapshotForPull encountered an error', {
        sessionId,
        ...error,
      });
      await this.store.models.SyncSession.markSessionErrored(sessionId, error.message);
    } finally {
      if (transactionTimeout) clearTimeout(transactionTimeout);
      await unmarkSessionAsProcessing();
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
    const session = await this.connectToSession(sessionId);
    const totalToPull = await countSyncSnapshotRecords(
      this.store.sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );
    await this.store.models.SyncSession.addDebugInfo(sessionId, { totalToPull });
    const { pullUntil } = session;
    return { totalToPull, pullUntil };
  }

  async getOutgoingChanges(sessionId, { fromId, limit }) {
    const session = await this.connectToSession(sessionId);
    const snapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
      this.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
      fromId,
      limit,
    );
    const { minSourceTick, maxSourceTick, isMobile } = session.parameters;

    // Currently on mobile we don't need to attach changelog to snapshot records
    // as changelog data is not stored on mobile. We can also skip if the source tick range is not available.
    if (isMobile || !minSourceTick || !maxSourceTick) {
      return snapshotRecords;
    }

    const recordsForPull = await attachChangelogToSnapshotRecords(this.store, snapshotRecords, {
      minSourceTick,
      maxSourceTick,
    });
    return recordsForPull;
  }

  async persistIncomingChanges(sessionId, deviceId, tablesToInclude, isMobile) {
    const { sequelize, models } = this.store;
    const totalPushed = await countSyncSnapshotRecords(
      sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.INCOMING,
    );
    await models.SyncSession.addDebugInfo(sessionId, { beganPersistAt: new Date(), totalPushed });

    const modelsToInclude = tablesToInclude
      ? filterModelsFromName(models, tablesToInclude)
      : getModelsForPush(models);

    try {
      // commit the changes to the db
      const persistedAtSyncTick = await sequelize.transaction(async () => {
        // currently we do not create audit logs on mobile devices
        // so we rely on sync process to create audit logs
        if (!isMobile) {
          await pauseAudit(sequelize);
        }
        // we tick-tock the global clock to make sure there is a unique tick for these changes
        // n.b. this used to also be used for concurrency control, but that is now handled by
        // shared advisory locks taken using the current sync tick as the id, which are waited on
        // by an exclusive lock taken prior to starting a snapshot - so this is now purely for
        // saving with a unique tick
        const { tock } = await this.tickTockGlobalClock();

        // run any side effects for each model
        // eg: resolving duplicated patient display IDs
        await incomingSyncHook(sequelize, modelsToInclude, sessionId);

        await saveIncomingChanges(sequelize, modelsToInclude, sessionId, true);
        // store the sync tick on save with the incoming changes, so they can be compared for
        // edits with the outgoing changes
        await updateSnapshotRecords(
          sequelize,
          sessionId,
          { savedAtSyncTick: tock },
          { direction: SYNC_SESSION_DIRECTION.INCOMING },
        );

        // Tick tock once more to ensure that no records that are subsequently modified will share the same sync tick as the incoming changes
        // notably so that if records are modified by adjustDataPostSyncPush(), they will be picked up for pulling in the same session
        // (specifically won't be removed by removeEchoedChanges())
        await this.tickTockGlobalClock();

        return tock;
      });

      await models.SyncDeviceTick.create({
        deviceId,
        persistedAtSyncTick,
      });
      await adjustDataPostSyncPush(sequelize, modelsToInclude, sessionId);

      // mark for repull any records that were modified by an incoming sync hook
      await bumpSyncTickForRepull(sequelize, modelsToInclude, sessionId);

      // mark persisted so that client polling "completePush" can stop
      await models.SyncSession.update(
        { persistCompletedAt: new Date() },
        { where: { id: sessionId } },
      );

      // WARNING: if you are adding another db call here, you need to either move the
      // persistCompletedAt lower down, or change the check in checkPushComplete
    } catch (error) {
      log.error('CentralSyncManager.persistIncomingChanges encountered an error', error);
      await models.SyncSession.markSessionErrored(sessionId, error.message);
    }
  }

  #modelMap = null;
  async addIncomingChanges(sessionId, changes) {
    const { sequelize, models } = this.store;
    await this.connectToSession(sessionId);

    if (!this.#modelMap) {
      this.#modelMap = new Map(
        Object.values(models)
          .filter(m => m.tableName && m.usesPublicSchema)
          .map(m => [m.tableName, m]),
      );
    }

    for (const change of changes) {
      const model = this.#modelMap.get(change.recordType);
      if (!model) {
        const errorMessage = `Sync security violation: Attempted to push record with unknown model`;
        log.error(errorMessage, {
          recordType: change.recordType,
          recordId: change.recordId,
          reason: 'Model not found',
          sessionId,
        });

        await models.SyncSession.addDebugInfo(sessionId, {
          rejectedRecord: { type: change.recordType, id: change.recordId },
        });

        await models.SyncSession.markSessionErrored(sessionId, errorMessage);
        throw new Error(errorMessage);
      }

      if (
        ![
          SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
          SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE,
          SYNC_DIRECTIONS.BIDIRECTIONAL,
        ].includes(model.syncDirection)
      ) {
        const errorMessage = `Sync security violation: Attempted to push record that is not allowed to be pushed`;
        log.error(errorMessage, {
          recordType: change.recordType,
          recordId: change.recordId,
          syncDirection: model.syncDirection,
          reason: `Model has syncDirection '${model.syncDirection}' which is not allowed for push operations`,
          sessionId,
        });

        await models.SyncSession.addDebugInfo(sessionId, {
          rejectedRecord: { type: change.recordType, id: change.recordId },
        });

        await models.SyncSession.markSessionErrored(sessionId, errorMessage);
        throw new Error(errorMessage);
      }
    }

    const incomingSnapshotRecords = changes.map(c => ({
      ...c,
      direction: SYNC_SESSION_DIRECTION.INCOMING,
      updatedAtByFieldSum: c.data.updatedAtByField
        ? Object.values(c.data.updatedAtByField).reduce((s, v) => s + v)
        : null,
    }));

    log.debug('CentralSyncManager.addIncomingChanges', {
      incomingSnapshotRecordsCount: incomingSnapshotRecords.length,
      sessionId,
    });

    await insertSnapshotRecords(sequelize, sessionId, incomingSnapshotRecords);
  }

  async completePush(sessionId, deviceId, tablesToInclude) {
    const session = await this.connectToSession(sessionId);

    // don't await persisting, the client should asynchronously poll as it may take longer than
    // the http request timeout
    const unmarkSessionAsProcessing = await this.markSessionAsProcessing(sessionId);
    this.persistIncomingChanges(
      sessionId,
      deviceId,
      tablesToInclude,
      session.parameters.isMobile,
    ).finally(unmarkSessionAsProcessing);
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
