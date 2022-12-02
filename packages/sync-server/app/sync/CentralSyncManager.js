import { Op, Transaction } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { CURRENT_SYNC_TIME_KEY } from 'shared/sync/constants';
import { log } from 'shared/services/logging';
import {
  getModelsForDirection,
  getOutgoingChangesForSession,
  removeEchoedChanges,
  saveIncomingChanges,
  completeSyncSession,
  completeInactiveSyncSessions,
  getOutgoingChangesCount,
  SYNC_SESSION_DIRECTION,
} from 'shared/sync';
import { injectConfig } from 'shared/utils/withConfig';
import { getPatientLinkedModels } from './getPatientLinkedModels';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';
import { filterModelsFromName } from './filterModelsFromName';

const errorMessageFromSession = session =>
  `Sync session '${session.id}' encountered an error: ${session.error}`;

// TODO this could be in a utils folder
const idToInteger = id => parseInt(id.replace('-', ''), 16); // parse as hex

// about variables lapsedSessionSeconds and lapsedSessionCheckFrequencySeconds:
// after x minutes of no activity, consider a session lapsed and wipe it to avoid holding invalid
// changes in the database when a sync fails on the facility server end

export
@injectConfig
class CentralSyncManager {
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
    await this.store.sequelize.query('SELECT pg_advisory_xact_lock(:snapshotLockId);', {
      replacements: { snapshotLockId: idToInteger(sessionId) },
    });
  }

  async checkSnapshotIsProcessing(sessionId) {
    const [rows] = await this.store.sequelize.query(
      'SELECT NOT(pg_try_advisory_xact_lock(:snapshotLockId)) AS snapshot_is_processing;',
      {
        replacements: { snapshotLockId: idToInteger(sessionId) },
      },
    );
    return rows[0].snapshot_is_processing;
  }

  // set pull filter begins creating a snapshot of changes to pull at this point in time, and
  // returns a sync tick that we can safely consider the snapshot to be up to (because we use the
  // "tick" of the tick-tock, so we know any more changes on the server, even while the snapshot
  // process is ongoing, will have a later updated_at_sync_tick)
  async setPullFilter(
    sessionId,
    { since, facilityId, tablesToInclude, tablesForFullResync, isMobile },
  ) {
    const { tick } = await this.tickTockGlobalClock();

    const { models } = this.store;

    const session = await this.connectToSession(sessionId);

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

    // don't await the rest of the snapshot process, as it takes a while - the sync client will
    // poll for it to finish
    this.setupSnapshot(session, {
      since,
      facilityId,
      modelsToInclude,
      tablesForFullResync,
      patientIdsForFullSync,
      sessionConfig,
    });
    return { tick };
  }

  async setupSnapshot(
    session,
    {
      since,
      facilityId,
      modelsToInclude,
      tablesForFullResync,
      sessionConfig,
      patientIdsForFullSync,
    },
  ) {
    // TODO if a fetchPullCount hits right at this moment, it could see a not-yet-locked advisory lock and a null snapshotCompletedAt, despite everything being fine

    try {
      // snapshot inside a "repeatable read" transaction, so that other changes made while this
      // snapshot is underway aren't included (as this could lead to a pair of foreign records with
      // the child in the snapshot and its parent missing)
      // as the snapshot only contains read queries plus writes to the specific rows in
      // sync_session_records that it controls, there should be no concurrent update issues :)
      await this.store.sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
        async () => {
          await this.markSnapshotAsProcessing(session.id);

          // full changes
          await snapshotOutgoingChanges(
            getPatientLinkedModels(modelsToInclude),
            -1, // for all time, i.e. 0 onwards
            patientIdsForFullSync,
            session.id,
            facilityId,
            {}, // sending empty session config because this snapshot attempt is only for syncing new marked for sync patients
          );

          // get changes since the last successful sync for all other synced patients and independent
          // record types
          const patientFacilities = await this.store.models.PatientFacility.findAll({
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
            session.id,
            facilityId,
            sessionConfig,
          );

          // any tables for full resync from (used when mobile needs to wipe and resync tables as
          // part of the upgrade process)
          if (tablesForFullResync) {
            const modelsForFullResync = filterModelsFromName(
              this.store.models,
              tablesForFullResync,
            );
            await snapshotOutgoingChanges(
              getModelsForDirection(modelsForFullResync, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
              -1,
              patientIdsForRegularSync,
              session.id,
              facilityId,
              sessionConfig,
            );
          }

          // delete any outgoing changes that were just pushed in during the same session
          await removeEchoedChanges(this.store, session.id);
        },
      );

      // TODO if a fetchPullCount hits right at this moment, it could see a released advisory lock and a null snapshotCompletedAt, despite everything being fine

      // this update to the session needs to happen outside of the transaction, as the repeatable
      // read isolation level can suffer serialization failures if a record is updated inside and
      // outside the transaction, and the session is being updated to show the last connection
      // time throughout the snapshot process
      await session.update({ snapshotCompletedAt: new Date() });
    } catch (error) {
      log.error('CentralSyncManager.setPullFilter encountered an error', error);
      await session.update({ error: error.message });
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
    return getOutgoingChangesCount(this.store, sessionId);
  }

  async getOutgoingChanges(sessionId, { fromId, limit }) {
    await this.connectToSession(sessionId);
    return getOutgoingChangesForSession(
      this.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
      fromId,
      limit,
    );
  }

  async addIncomingChanges(sessionId, changes, { pushedSoFar, totalToPush }, tablesToInclude) {
    const { models } = this.store;
    await this.connectToSession(sessionId);
    const syncSessionRecords = changes.map(c => ({
      ...c,
      direction: SYNC_SESSION_DIRECTION.INCOMING,
      sessionId,
      updatedAtByFieldSum: c.data.updatedAtByField
        ? Object.values(c.data.updatedAtByField).reduce((s, v) => s + v)
        : null,
    }));

    log.debug(
      `CentralSyncManager.addIncomingChanges: Adding ${syncSessionRecords.length} changes for ${sessionId}`,
    );
    await models.SyncSessionRecord.bulkCreate(syncSessionRecords);

    if (pushedSoFar === totalToPush) {
      const modelsToInclude = tablesToInclude
        ? filterModelsFromName(models, tablesToInclude)
        : getModelsForDirection(models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL);

      // commit the changes to the db
      await this.store.sequelize.transaction(async () => {
        // we tick-tock the global clock to make sure there is a unique tick for these changes, and
        // to acquire a lock on the sync time row in the local system facts table, so that no sync
        // pull snapshot can start while this save is still in progress
        // the pull snapshot starts by updating the current time, so this locks that out while the
        // save transaction happens, to avoid the snapshot missing records that get during this save
        // but aren't visible in the db to be snapshot until the transaction commits, so would
        // otherwise be completely skipped over by that sync client
        const { tock } = await this.tickTockGlobalClock();
        await saveIncomingChanges(models, modelsToInclude, sessionId, true);
        // store the sync tick on save with the incoming changes, so they can be compared for
        // edits with the outgoing changes
        await models.SyncSessionRecord.update({ savedAtSyncTick: tock }, { where: { sessionId } });
      });
      await models.SyncSession.addDebugInfo(sessionId, {
        pushCompletedAt: await models.LocalSystemFact.get(CURRENT_SYNC_TIME_KEY),
      });
    }
  }
}
