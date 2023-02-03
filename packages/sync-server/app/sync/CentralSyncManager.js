import { Op, Transaction } from 'sequelize';
import _config from 'config';

import { SYNC_DIRECTIONS } from 'shared/constants';
import { CURRENT_SYNC_TIME_KEY } from 'shared/sync/constants';
import { log } from 'shared/services/logging';
import {
  createSnapshotTable,
  insertSnapshotRecords,
  updateSnapshotRecords,
  completeInactiveSyncSessions,
  completeSyncSession,
  countSyncSnapshotRecords,
  findSyncSnapshotRecords,
  getModelsForDirection,
  removeEchoedChanges,
  saveIncomingChanges,
  SYNC_SESSION_DIRECTION,
} from 'shared/sync';
import { uuidToFairlyUniqueInteger } from 'shared/utils';

import { getPatientLinkedModels } from './getPatientLinkedModels';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';
import { filterModelsFromName } from './filterModelsFromName';

const errorMessageFromSession = session =>
  `Sync session '${session.id}' encountered an error: ${session.error}`;

// about variables lapsedSessionSeconds and lapsedSessionCheckFrequencySeconds:
// after x minutes of no activity, consider a session lapsed and wipe it to avoid holding invalid
// changes in the database when a sync fails on the facility server end

export class CentralSyncManager {
  config = _config;

  currentSyncTick;

  store;

  purgeInterval;

  constructor(ctx) {
    this.store = ctx.store;
    this.purgeInterval = setInterval(
      this.purgeLapsedSessions,
      this.constructor.config.sync.lapsedSessionCheckFrequencySeconds * 1000,
    );
    ctx.onClose(this.close);
  }

  static overrideConfig(override) {
    this.config = override;
  }

  static restoreConfig() {
    this.config = _config.default;
  }

  close = () => clearInterval(this.purgeInterval);

  purgeLapsedSessions = async () => {
    await completeInactiveSyncSessions(
      this.store,
      this.constructor.config.sync.lapsedSessionSeconds,
    );
  };

  async tickTockGlobalClock() {
    // rather than just incrementing by one tick, we "tick, tock" the clock so we guarantee the
    // "tick" part to be unique to the requesting client, and any changes made directly on the
    // central server will be recorded as updated at the "tock", avoiding any direct changes
    // (e.g. imports) being missed by a client that is at the same sync tick
    const tock = await this.store.models.LocalSystemFact.increment(CURRENT_SYNC_TIME_KEY, 2);
    return { tick: tock - 1, tock };
  }

  async startSession() {
    // as a side effect of starting a new session, cause a tick on the global sync clock
    // this is a convenient way to tick the clock, as it means that no two sync sessions will
    // happen at the same global sync time, meaning there's no ambiguity when resolving conflicts

    const startTime = new Date();
    const syncSession = await this.store.models.SyncSession.create({
      startTime,
      lastConnectionTime: startTime,
    });
    await createSnapshotTable(this.store.sequelize, syncSession.id);

    log.debug(`CentralSyncManager.startSession: Started a new session ${syncSession.id}`);

    const { tick } = await this.tickTockGlobalClock();

    return { sessionId: syncSession.id, tick };
  }

  async connectToSession(sessionId) {
    const session = await this.store.sequelize.models.SyncSession.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Sync session '${sessionId}' not found`);
    }
    if (session.error) {
      throw new Error(errorMessageFromSession(session));
    }
    await session.update({ lastConnectionTime: Date.now() });

    return session;
  }

  async endSession(sessionId) {
    const session = await this.connectToSession(sessionId);
    log.info(
      `Sync session ${session.id} performed in ${(Date.now() - session.startTime) / 1000} seconds`,
    );
    await completeSyncSession(this.store, sessionId);
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

  // set pull filter begins creating a snapshot of changes to pull at this point in time, and
  // returns a sync tick that we can safely consider the snapshot to be up to (because we use the
  // "tick" of the tick-tock, so we know any more changes on the server, even while the snapshot
  // process is ongoing, will have a later updated_at_sync_tick)
  async setPullFilter(sessionId, params) {
    const { tick } = await this.tickTockGlobalClock();
    const unmarkSnapshotAsProcessing = await this.markSnapshotAsProcessing(sessionId);
    this.setupSnapshot(sessionId, params, unmarkSnapshotAsProcessing); // don't await, as it takes a while - the sync client will poll for it to finish
    return { tick };
  }

  async setupSnapshot(
    sessionId,
    { since, facilityId, tablesToInclude, tablesForFullResync, isMobile },
    unmarkSnapshotAsProcessing,
  ) {
    const { models } = this.store;

    const session = await this.connectToSession(sessionId);

    try {
      await models.SyncSession.addDebugInfo(sessionId, {
        facilityId,
        since,
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
      log.debug(
        `CentralSyncManager.setPullFilter: ${newPatientFacilities.length} patients newly marked for sync for ${facilityId}`,
      );
      const patientIdsForFullSync = newPatientFacilities.map(n => n.patientId);

      const { syncAllLabRequests } = await models.Setting.forFacility(facilityId);
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
      log.error('CentralSyncManager.setPullFilter encountered an error', error);
      await session.update({ error: error.message });
    } finally {
      await unmarkSnapshotAsProcessing();
    }
  }

  async fetchPullCount(sessionId) {
    // if this snapshot still processing, return null to tell the client to keep waiting
    const snapshotIsProcessing = await this.checkSnapshotIsProcessing(sessionId);
    if (snapshotIsProcessing) {
      return null;
    }

    // if this snapshot is not marked as processing, but also never completed, record an error
    const session = await this.connectToSession(sessionId);
    if (session.snapshotCompletedAt === null) {
      session.error =
        'Snapshot processing incomplete, likely because the central server restarted during the snapshot';
      await session.save();
      throw new Error(errorMessageFromSession(session));
    }

    // snapshot processing complete! return the actual count
    return countSyncSnapshotRecords(
      this.store.sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );
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

  async addIncomingChanges(sessionId, changes, { pushedSoFar, totalToPush }, tablesToInclude) {
    const { models, sequelize } = this.store;
    await this.connectToSession(sessionId);
    const incomingSnapshotRecords = changes.map(c => ({
      ...c,
      direction: SYNC_SESSION_DIRECTION.INCOMING,
      updatedAtByFieldSum: c.data.updatedAtByField
        ? Object.values(c.data.updatedAtByField).reduce((s, v) => s + v)
        : null,
    }));

    log.debug(
      `CentralSyncManager.addIncomingChanges: Adding ${incomingSnapshotRecords.length} changes for ${sessionId}`,
    );
    await insertSnapshotRecords(sequelize, sessionId, incomingSnapshotRecords);

    if (pushedSoFar === totalToPush) {
      const modelsToInclude = tablesToInclude
        ? filterModelsFromName(models, tablesToInclude)
        : getModelsForDirection(models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL);

      // commit the changes to the db
      await sequelize.transaction(async () => {
        // we tick-tock the global clock to make sure there is a unique tick for these changes, and
        // to acquire a lock on the sync time row in the local system facts table, so that no sync
        // pull snapshot can start while this save is still in progress
        // the pull snapshot starts by updating the current time, so this locks that out while the
        // save transaction happens, to avoid the snapshot missing records that get during this save
        // but aren't visible in the db to be snapshot until the transaction commits, so would
        // otherwise be completely skipped over by that sync client
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
      await models.SyncSession.addDebugInfo(sessionId, {
        pushCompletedAt: await models.LocalSystemFact.get(CURRENT_SYNC_TIME_KEY),
      });
    }
  }
}
