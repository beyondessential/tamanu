import { Op } from 'sequelize';
import config from 'config';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { log } from 'shared/services/logging';
import {
  getModelsForDirection,
  snapshotOutgoingChangesForCentral,
  getOutgoingChangesForSession,
  removeEchoedChanges,
  saveIncomingChanges,
  deleteSyncSession,
  deleteInactiveSyncSessions,
  getOutgoingChangesCount,
  SYNC_SESSION_DIRECTION,
} from 'shared/sync';
import { initDatabase } from '../database';
import { getPatientLinkedModels } from './getPatientLinkedModels';

// after x minutes of no activity, consider a session lapsed and wipe it to avoid holding invalid
// changes in the database when a sync fails on the facility server end
const { lapsedSessionSeconds, lapsedSessionCheckFrequencySeconds } = config.sync;

export class CentralSyncManager {
  currentSyncTick;

  sessions = {};

  constructor() {
    setInterval(this.purgeLapsedSessions, lapsedSessionCheckFrequencySeconds * 1000);
  }

  purgeLapsedSessions = async () => {
    const store = await initDatabase({ testMode: false, syncClientMode: false });
    await deleteInactiveSyncSessions(store, lapsedSessionSeconds);
  };

  async startSession({ sequelize }) {
    // as a side effect of starting a new session, cause a tick on the global sync clock
    // this is a convenient way to tick the clock, as it means that no two sync sessions will
    // happen at the same global sync time, meaning there's no ambiguity when resolving conflicts
    const [[{ nextval: syncClockTick }]] = await sequelize.query(
      `SELECT nextval('sync_clock_sequence')`,
    );

    const startTime = new Date();
    const syncSession = await sequelize.models.SyncSession.create({
      syncTick: syncClockTick,
      startTime,
      lastConnectionTime: startTime,
    });

    return { sessionId: syncSession.id, syncClockTick };
  }

  async connectToSession(store, sessionId) {
    const session = await store.sequelize.models.SyncSession.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Sync session '${sessionId}' not found`);
    }
    await session.update({ lastConnectionTime: Date.now() });

    return session;
  }

  async endSession(store, sessionId) {
    const session = await this.connectToSession(store, sessionId);
    log.info(`Sync session performed in ${(Date.now() - session.startTime) / 1000} seconds`);
    await deleteSyncSession(store, sessionId);
  }

  // The hardest thing about sync is knowing what happens at the clock tick border - do we want
  // records strictly >, or >= the cursor being requested? The truth is, it doesn't matter! A given
  // tick is unique to one device, and gets updated at the end of its sync session, so if a device
  // is requesting records "since" tick x, we know that it only has records from the central server
  // that are _below_ that tick, but also has all records locally _at_ that tick already - it must
  // have been the one that changed them, if they have an update tick unique to that device!
  // For sanity's sake, we use > consistently, because it aligns with "since"
  async setPullFilter(sessionId, { since, facilityId }, store) {
    const { models } = store;

    await this.connectToSession(store, sessionId);

    const facilitySettings = await models.Setting.forFacility(facilityId);

    // work out if any patients were newly marked for sync since this device last connected, and
    // include changes from all time for those patients
    const newPatientFacilities = await models.PatientFacility.findAll({
      where: { facilityId, updatedAtSyncTick: { [Op.gt]: since } },
    });
    const patientIdsForFullSync = newPatientFacilities.map(n => n.patientId);

    await store.sequelize.transaction(async () => {
      // full changes
      await snapshotOutgoingChangesForCentral(
        getPatientLinkedModels(models),
        models,
        0,
        patientIdsForFullSync,
        sessionId,
      );

      // get changes since the last successful sync for all other synced patients and independent
      // record types
      const patientFacilities = await models.PatientFacility.findAll({ where: { facilityId } });
      const patientIdsForRegularSync = patientFacilities
        .map(p => p.patientId)
        .filter(patientId => !patientIdsForFullSync.includes(patientId));

      // regular changes
      await snapshotOutgoingChangesForCentral(
        getModelsForDirection(models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
        models,
        since,
        patientIdsForRegularSync,
        sessionId,
        facilitySettings,
      );

      await removeEchoedChanges(store, sessionId);
    });

    return getOutgoingChangesCount(store, sessionId);
  }

  async getOutgoingChanges(store, sessionId, { offset, limit }) {
    this.connectToSession(store, sessionId);
    return getOutgoingChangesForSession(
      store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
      offset,
      limit,
    );
  }

  async addIncomingChanges(sessionId, changes, { pageNumber, totalPages }, store) {
    const { models } = store;
    await this.connectToSession(store, sessionId);
    const sessionSyncRecords = changes.map(c => ({
      ...c,
      direction: SYNC_SESSION_DIRECTION.INCOMING,
      sessionId,
    }));

    await models.SessionSyncRecord.bulkCreate(sessionSyncRecords);

    if (pageNumber === totalPages) {
      await store.sequelize.transaction(async () => {
        await saveIncomingChanges(
          models,
          getModelsForDirection(models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL),
          sessionId,
          true,
        );
      });
    }
  }
}
