import { trace } from '@opentelemetry/api';
import { Op, Transaction } from 'sequelize';
import _config from 'config';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { CURRENT_SYNC_TIME_KEY } from 'shared/sync/constants';
import { log } from 'shared/services/logging';
import {
  createSnapshotTable,
  insertSnapshotRecords,
  updateSnapshotRecords,
  completeSyncSession,
  countSyncSnapshotRecords,
  findSyncSnapshotRecords,
  getModelsForDirection,
  removeEchoedChanges,
  saveIncomingChanges,
  adjustDataPostSyncPush,
  waitForPendingEditsUsingSyncTick,
  getSyncTicksOfPendingEdits,
  SYNC_SESSION_DIRECTION,
} from 'shared/sync';
import { uuidToFairlyUniqueInteger } from 'shared/utils';

import { getPatientLinkedModels } from './getPatientLinkedModels';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';
import { filterModelsFromName } from './filterModelsFromName';
import { startSnapshotWhenCapacityAvailable } from './startSnapshotWhenCapacityAvailable';

const errorMessageFromSession = session =>
  `Sync session '${session.id}' encountered an error: ${session.error}`;

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

  async tickTockGlobalClock() {
    // rather than just incrementing by one tick, we "tick, tock" the clock so we guarantee the
    // "tick" part to be unique to the requesting client, and any changes made directly on the
    // central server will be recorded as updated at the "tock", avoiding any direct changes
    // (e.g. imports) being missed by a client that is at the same sync tick
    const tock = await this.store.models.LocalSystemFact.increment(CURRENT_SYNC_TIME_KEY, 2);
    return { tick: tock - 1, tock };
  }

  async startSession(userId, deviceId) {
    // as a side effect of starting a new session, cause a tick on the global sync clock
    // this is a convenient way to tick the clock, as it means that no two sync sessions will
    // happen at the same global sync time, meaning there's no ambiguity when resolving conflicts

    const startTime = new Date();
    const syncSession = await this.store.models.SyncSession.create({
      startTime,
      lastConnectionTime: startTime,
      debugInfo: { userId, deviceId },
    });

    // no await as prepare session (especially the tickTockGlobalClock action) might get blocked
    // and take a while if the central server is concurrently persisting records from another client.
    // Client should poll for the result later.
    this.prepareSession(syncSession);

    log.info('CentralSyncManager.startSession', { sessionId: syncSession.id, deviceId });

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
    if (session.completedAt) {
      throw new Error(`Sync session '${sessionId}' is already completed`);
    }
    if (session.error) {
      throw new Error(errorMessageFromSession(session));
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
    log.info('CentralSyncManager.completedSession', { sessionId, durationMs });
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
      await this.store.models.SyncSession.update(
        { error: error.message },
        { where: { id: sessionId } },
      );
    }
  }

  async setupSnapshotForPull(
    sessionId,
    { since, facilityId, tablesToInclude, tablesForFullResync, isMobile },
    unmarkSnapshotAsProcessing,
  ) {
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

      // get all the ticks (ie: keys of in-flight transaction advisory locks) of previously pending edits
      const pendingSyncTicks = (await getSyncTicksOfPendingEdits(sequelize)).filter(t => t < tick);

      // wait for any in-flight transactions of pending edits
      // that we don't miss any changes that are in progress
      await Promise.all(pendingSyncTicks.map(t => waitForPendingEditsUsingSyncTick(sequelize, t)));

      await models.SyncSession.update(
        { pullSince: since, pullUntil: tick },
        { where: { id: sessionId } },
      );

      await models.SyncSession.addDebugInfo(sessionId, {
        facilityId,
        isMobile,
        tablesForFullResync,
      });

      const modelsToInclude = tablesToInclude
        ? filterModelsFromName(models, tablesToInclude)
        : models;

      // work out if any patients were newly marked for sync since this device last connected, and
      // include changes from all time for those patients
      const newPatientFacilities = await models.PatientFacility.findAll({
        where: { facilityId, updatedAtSyncTick: { [Op.gt]: since } },
      });
      log.debug('CentralSyncManager.initiatePull', {
        facilityId,
        newlyMarkedPatientCount: newPatientFacilities.length,
      });
      const patientIdsForFullSync = newPatientFacilities.map(n => n.patientId);

      const syncAllLabRequests = await models.Setting.get('syncAllLabRequests', facilityId);
      const sessionConfig = {
        // for facilities with a lab, need ongoing lab requests
        // no need for historical ones on initial sync, and no need on mobile
        syncAllLabRequests: syncAllLabRequests && !isMobile && since > -1,
        syncAllEncountersForTheseVaccines: isMobile
          ? this.constructor.config.sync.syncAllEncountersForTheseVaccines
          : [],
        isMobile,
      };

      // snapshot inside a "repeatable read" transaction, so that other changes made while this
      // snapshot is underway aren't included (as this could lead to a pair of foreign records with
      // the child in the snapshot and its parent missing)
      // as the snapshot only contains read queries plus writes to the specific sync snapshot table
      // that it controls, there should be no concurrent update issues :)
      await this.store.sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
        async () => {
          // full changes
          await snapshotOutgoingChanges(
            getPatientLinkedModels(modelsToInclude),
            -1, // for all time, i.e. 0 onwards
            patientIdsForFullSync,
            sessionId,
            facilityId,
            {}, // sending empty session config because this snapshot attempt is only for syncing new marked for sync patients
          );

          // get changes since the last successful sync for all other synced patients and independent
          // record types
          const patientFacilities = await models.PatientFacility.findAll({
            where: { facilityId },
          });
          const patientIdsForRegularSync = patientFacilities
            .map(p => p.patientId)
            .filter(patientId => !patientIdsForFullSync.includes(patientId));

          // regular changes
          await snapshotOutgoingChanges(
            getModelsForDirection(modelsToInclude, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
            since,
            patientIdsForRegularSync,
            sessionId,
            facilityId,
            sessionConfig,
          );

          // any tables for full resync from (used when mobile needs to wipe and resync tables as
          // part of the upgrade process)
          if (tablesForFullResync) {
            const modelsForFullResync = filterModelsFromName(models, tablesForFullResync);
            await snapshotOutgoingChanges(
              getModelsForDirection(modelsForFullResync, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
              -1,
              patientIdsForRegularSync,
              sessionId,
              facilityId,
              sessionConfig,
            );
          }

          // delete any outgoing changes that were just pushed in during the same session
          await removeEchoedChanges(this.store, sessionId);
        },
      );
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
      await this.store.models.SyncSession.update(
        { error: error.message },
        { where: { id: sessionId } },
      );
    } finally {
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
      session.error =
        'Snapshot processing incomplete, likely because the central server restarted during the snapshot';
      await session.save();
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

  async persistIncomingChanges(sessionId, tablesToInclude) {
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
      await sequelize.transaction(async () => {
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
      await models.SyncSession.update({ error: error.message }, { where: { id: sessionId } });
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

  async completePush(sessionId, tablesToInclude) {
    await this.connectToSession(sessionId);

    // don't await persisting, the client should asynchronously poll as it may take longer than
    // the http request timeout
    this.persistIncomingChanges(sessionId, tablesToInclude);
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
