import { trace } from '@opentelemetry/api';
import { Op } from 'sequelize';
import _config from 'config';

import { SYNC_DIRECTIONS, DEBUG_LOG_TYPES } from '@tamanu/constants';
import {
  CURRENT_SYNC_TIME_KEY,
  LOOKUP_UP_TO_TICK_KEY,
  SYNC_LOOKUP_PENDING_UPDATE_FLAG,
} from '@tamanu/shared/sync/constants';
import { log } from '@tamanu/shared/services/logging';
import {
  adjustDataPostSyncPush,
  completeSyncSession,
  countSyncSnapshotRecords,
  createSnapshotTable,
  findSyncSnapshotRecords,
  getModelsForDirection,
  getSyncTicksOfPendingEdits,
  insertSnapshotRecords,
  removeEchoedChanges,
  saveIncomingChanges,
  SYNC_SESSION_DIRECTION,
  updateSnapshotRecords,
  waitForPendingEditsUsingSyncTick,
} from '@tamanu/shared/sync';
import { uuidToFairlyUniqueInteger } from '@tamanu/shared/utils';

import { getPatientLinkedModels } from './getPatientLinkedModels';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';
import { filterModelsFromName } from './filterModelsFromName';
import { startSnapshotWhenCapacityAvailable } from './startSnapshotWhenCapacityAvailable';
import { createMarkedForSyncPatientsTable } from './createMarkedForSyncPatientsTable';
import { updateLookupTable, updateSyncLookupPendingRecords } from './updateLookupTable';
import { repeatableReadTransaction } from './repeatableReadTransaction';

const errorMessageFromSession = session =>
  `Sync session '${session.id}' encountered an error: ${session.errors[session.errors.length - 1]}`;

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

  constructor(ctx) {
    this.store = ctx.store;
    ctx.onClose(this.close);
  }

  close = () => clearInterval(this.purgeInterval);

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
    const tock = await this.store.models.LocalSystemFact.increment(CURRENT_SYNC_TIME_KEY, 2);
    return { tick: tock - 1, tock };
  }

  async startSession(debugInfo = {}) {
    // as a side effect of starting a new session, cause a tick on the global sync clock
    // this is a convenient way to tick the clock, as it means that no two sync sessions will
    // happen at the same global sync time, meaning there's no ambiguity when resolving conflicts

    const startTime = new Date();
    const syncSession = await this.store.models.SyncSession.create({
      startTime,
      lastConnectionTime: startTime,
      debugInfo,
    });

    // no await as prepare session (especially the tickTockGlobalClock action) might get blocked
    // and take a while if the central server is concurrently persisting records from another client.
    // Client should poll for the result later.
    const preparation = this.prepareSession(syncSession);

    // ...but in unit tests, the tests interfere with each other if we leave prepares running
    // in the background! So, allow overriding the above behaviour.
    if (this.constructor.config.sync.awaitPreparation) {
      await preparation;
    }

    log.info('CentralSyncManager.startSession', {
      sessionId: syncSession.id,
      ...debugInfo,
    });

    return { sessionId: syncSession.id };
  }

  async prepareSession(syncSession) {
    await createSnapshotTable(this.store.sequelize, syncSession.id);

    const { tick } = await this.tickTockGlobalClock();

    await this.store.sequelize.models.SyncSession.update(
      { startedAtTick: tick },
      { where: { id: syncSession.id } },
    );
    // eslint-disable-next-line no-unused-expressions
    trace.getActiveSpan()?.setAttributes({
      'app.sync.sessionId': syncSession.id,
      'app.sync.tick': tick,
    });

    return { sessionId: syncSession.id, tick };
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
    log.info('CentralSyncManager.completedSession', {
      sessionId,
      durationMs,
      facilityId: session.debugInfo.facilityId,
      deviceId: session.debugInfo.deviceId,
    });
  }

  async markSnapshotAsProcessing(sessionId) {
    // Mark the snapshot as processing in a way that
    // a) can be read across processes, if the central server is running in cluster mode; and
    // b) will automatically get cleared if the process restarts
    // A transaction level advisory lock fulfils both of these criteria, as it sits at the database
    // level (independent of an individual node process), but will be unlocked if the transaction is
    // rolled back for any reason (e.g. the server restarts
    const transaction = await this.store.sequelize.transaction();
    await this.store.sequelize.query('SELECT pg_advisory_xact_lock(:snapshotLockId);', {
      replacements: { snapshotLockId: uuidToFairlyUniqueInteger(sessionId) },
      transaction,
    });
    const unmarkSnapshotAsProcessing = async () => {
      await transaction.commit();
    };
    return unmarkSnapshotAsProcessing;
  }

  async checkSnapshotIsProcessing(sessionId) {
    const [rows] = await this.store.sequelize.query(
      'SELECT NOT(pg_try_advisory_xact_lock(:snapshotLockId)) AS snapshot_is_processing;',
      {
        replacements: { snapshotLockId: uuidToFairlyUniqueInteger(sessionId) },
      },
    );
    return rows[0].snapshot_is_processing;
  }

  // set pull filter begins creating a snapshot of changes to pull at this point in time
  async initiatePull(sessionId, params) {
    try {
      await this.connectToSession(sessionId);

      // first check if the snapshot is already being processed, to throw a sane error if (for some
      // reason) the client managed to kick off the pull twice (ran into this in v1.24.0 and v1.24.1)
      const isAlreadyProcessing = await this.checkSnapshotIsProcessing(sessionId);
      if (isAlreadyProcessing) {
        throw new Error(`Snapshot for session ${sessionId} is already being processed`);
      }

      const unmarkSnapshotAsProcessing = await this.markSnapshotAsProcessing(sessionId);
      this.setupSnapshotForPull(sessionId, params, unmarkSnapshotAsProcessing); // don't await, as it takes a while - the sync client will poll for it to finish
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
        (await store.models.LocalSystemFact.get(LOOKUP_UP_TO_TICK_KEY)) || -1;

      await debugObject.addInfo({ since: previouslyUpToTick });

      const isInitialBuildOfLookupTable = parseInt(previouslyUpToTick, 10) === -1;

      await repeatableReadTransaction(store.sequelize, async transaction => {
        // do not need to update pending records when it is initial build
        // because it uses ticks from the actual tables for updated_at_sync_tick
        if (!isInitialBuildOfLookupTable) {
          transaction.afterCommit(async () => {
            // Wrap inside transaction so that any writes to currentSyncTick
            // will have to wait until this transaction is committed
            await store.sequelize.transaction(async () => {
              const { tick: currentTick } = await this.tickTockGlobalClock();
              await updateSyncLookupPendingRecords(store, currentTick);
            });
          });
        }

        // When it is initial build of sync lookup table, by setting it to null,
        // it will get the updated_at_sync_tick from the actual tables.
        // Otherwise, update it to SYNC_LOOKUP_PENDING_UPDATE_FLAG so that
        // it can update the flagged ones post transaction commit to the latest sync tick,
        // avoiding sync sessions missing records while sync lookup is being refreshed
        const syncLookupTick = isInitialBuildOfLookupTable ? null : SYNC_LOOKUP_PENDING_UPDATE_FLAG;

        await updateLookupTable(
          getModelsForDirection(this.store.models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
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
        await store.models.LocalSystemFact.set(LOOKUP_UP_TO_TICK_KEY, currentTick);
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
    { since, facilityId, tablesToInclude, tablesForFullResync, isMobile, deviceId },
    unmarkSnapshotAsProcessing,
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

      await models.SyncSession.update(
        { pullSince: since, pullUntil: tick },
        { where: { id: sessionId } },
      );

      await models.SyncSession.setParameters(sessionId, {
        isMobile,
        tablesForFullResync,
        useSyncLookup: this.constructor.config.sync.lookupTable.enabled,
      });

      const modelsToInclude = tablesToInclude
        ? filterModelsFromName(models, tablesToInclude)
        : models;

      // work out if any patients were newly marked for sync since this device last connected, and
      // include changes from all time for those patients
      const newPatientFacilitiesCount = await models.PatientFacility.count({
        where: { facilityId, updatedAtSyncTick: { [Op.gt]: since } },
      });
      log.debug('CentralSyncManager.initiatePull', {
        facilityId,
        newlyMarkedPatientCount: newPatientFacilitiesCount,
      });

      const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
        sequelize,
        sessionId,
        true,
        facilityId,
        since,
      );

      const incrementalSyncPatientsTable = await createMarkedForSyncPatientsTable(
        sequelize,
        sessionId,
        false,
        facilityId,
        since,
      );

      const syncAllLabRequests = await models.Setting.get('syncAllLabRequests', facilityId);

      const sessionConfig = {
        // for facilities with a lab, need ongoing lab requests
        // no need for historical ones on initial sync, and no need on mobile
        syncAllLabRequests: syncAllLabRequests && !isMobile && since > -1,
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
          facilityId,
          deviceId,
          {}, // sending empty session config because this snapshot attempt is only for syncing new marked for sync patients
        );

        // get changes since the last successful sync for all other synced patients and independent
        // record types
        const patientFacilitiesCount = await models.PatientFacility.count({
          where: { facilityId },
        });

        // regular changes
        await snapshotOutgoingChanges(
          this.store,
          getModelsForDirection(modelsToInclude, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
          since,
          patientFacilitiesCount,
          incrementalSyncPatientsTable,
          sessionId,
          facilityId,
          deviceId,
          sessionConfig,
        );

        // any tables for full resync from (used when mobile needs to wipe and resync tables as
        // part of the upgrade process)
        if (tablesForFullResync) {
          const modelsForFullResync = filterModelsFromName(models, tablesForFullResync);
          await snapshotOutgoingChanges(
            this.store,
            getModelsForDirection(modelsForFullResync, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
            -1,
            patientFacilitiesCount,
            incrementalSyncPatientsTable,
            sessionId,
            facilityId,
            deviceId,
            sessionConfig,
          );
        }

        // delete any outgoing changes that were just pushed in during the same session
        await removeEchoedChanges(this.store, sessionId);
      });
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
      await unmarkSnapshotAsProcessing();
    }
  }

  async checkSessionReady(sessionId) {
    await this.connectToSession(sessionId);
    const session = await this.connectToSession(sessionId);
    if (session.startedAtTick === null) {
      return false;
    }

    return true;
  }

  async checkPullReady(sessionId) {
    await this.connectToSession(sessionId);

    // if this snapshot still processing, return false to tell the client to keep waiting
    const snapshotIsProcessing = await this.checkSnapshotIsProcessing(sessionId);
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
    await this.connectToSession(sessionId);
    return findSyncSnapshotRecords(
      this.store.sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
      fromId,
      limit,
    );
  }

  async persistIncomingChanges(sessionId, deviceId, tablesToInclude) {
    const { sequelize, models } = this.store;
    const totalPushed = await countSyncSnapshotRecords(
      sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.INCOMING,
    );
    await models.SyncSession.addDebugInfo(sessionId, { beganPersistAt: new Date(), totalPushed });

    const modelsToInclude = tablesToInclude
      ? filterModelsFromName(models, tablesToInclude)
      : getModelsForDirection(models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL);

    try {
      // commit the changes to the db
      const persistedAtSyncTick = await sequelize.transaction(async () => {
        // we tick-tock the global clock to make sure there is a unique tick for these changes
        // n.b. this used to also be used for concurrency control, but that is now handled by
        // shared advisory locks taken using the current sync tick as the id, which are waited on
        // by an exclusive lock taken prior to starting a snapshot - so this is now purely for
        // saving with a unique tick
        const { tock } = await this.tickTockGlobalClock();
        await saveIncomingChanges(sequelize, modelsToInclude, sessionId, true);
        // store the sync tick on save with the incoming changes, so they can be compared for
        // edits with the outgoing changes
        await updateSnapshotRecords(
          sequelize,
          sessionId,
          { savedAtSyncTick: tock },
          { direction: SYNC_SESSION_DIRECTION.INCOMING },
        );

        return tock;
      });

      await models.SyncDeviceTick.create({
        deviceId,
        persistedAtSyncTick,
      });
      // tick tock global clock so that if records are modified by adjustDataPostSyncPush(),
      // they will be picked up for pulling in the same session (specifically won't be removed by removeEchoedChanges())
      await this.tickTockGlobalClock();
      await adjustDataPostSyncPush(sequelize, modelsToInclude, sessionId);

      // mark persisted so that client polling "completePush" can stop
      await models.SyncSession.update(
        { persistCompletedAt: new Date() },
        { where: { id: sessionId } },
      );
    } catch (error) {
      log.error('CentralSyncManager.persistIncomingChanges encountered an error', error);
      await models.SyncSession.markSessionErrored(sessionId, error.message);
    }
  }

  async addIncomingChanges(sessionId, changes) {
    const { sequelize } = this.store;
    await this.connectToSession(sessionId);
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
    await this.connectToSession(sessionId);

    // don't await persisting, the client should asynchronously poll as it may take longer than
    // the http request timeout
    this.persistIncomingChanges(sessionId, deviceId, tablesToInclude);
  }

  async checkPushComplete(sessionId) {
    const session = await this.connectToSession(sessionId);
    // respond with whether the push is properly complete, i.e. has been persisted to the db tables
    if (!session.persistCompletedAt) {
      return false;
    }
    return true;
  }
}
