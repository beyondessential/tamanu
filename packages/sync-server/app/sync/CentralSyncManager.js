import { Op } from 'sequelize';
import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { log } from 'shared/services/logging';
import {
  getModelsForDirection,
  snapshotOutgoingChangesForCentral,
  getOutgoingChangesForSession,
  removeEchoedChanges,
  saveIncomingChanges,
  deleteSyncSession,
  getOutgoingChangesCount,
  SYNC_SESSION_DIRECTION,
} from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { getPatientLinkedModels } from './getPatientLinkedModels';

// after 20 minutes of no activity, consider a session lapsed and wipe it to avoid holding invalid
// changes in memory when a sync fails on the facility server end
const LAPSE_AFTER_MILLISECONDS = 20 * 60 * 1000;
const CHECK_LAPSED_SESSIONS_INTERVAL = 1 * 60 * 1000; // check once per minute

export class CentralSyncManager {
  currentSyncTick;

  sessions = {};

  constructor() {
    setInterval(this.purgeLapsedSessions, CHECK_LAPSED_SESSIONS_INTERVAL);
  }

  purgeLapsedSessions = () => {
    const oldestValidTime = Date.now() - LAPSE_AFTER_MILLISECONDS;
    //TODO: Delete session and session records in the db
  };

  async startSession({ sequelize }) {
    // as a side effect of starting a new session, cause a tick on the global sync clock
    // this is a convenient way to tick the clock, as it means that no two sync sessions will
    // happen at the same global sync time, meaning there's no ambiguity when resolving conflicts
    const [[{ nextval: syncClockTick }]] = await sequelize.query(
      `SELECT nextval('sync_clock_sequence')`,
    );
    await sequelize.models.SyncSession.create({
      syncTick: syncClockTick,
      startTime,
      lastConnectionTime: startTime,
    });
    return { sessionId, syncClockTick };
  }

  async connectToSession({ sequelize }, sessionId) {
    const session = await sequelize.models.SyncSession.findOne({
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
    await this.connectToSession(store, sessionId);

    const facilitySettings = await models.Setting.forFacility(facilityId);

    const { models } = store;

    // work out if any patients were newly marked for sync since this device last connected, and
    // include changes from all time for those patients
    const newPatientFacilities = await models.PatientFacility.findAll({
      where: { facilityId, updatedAtSyncTick: { [Op.gt]: since } },
    });
    const patientIdsForFullSync = newPatientFacilities.map(n => n.patientId);

    await store.sequelize.transaction(async () => {
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

      await snapshotOutgoingChangesForCentral(
        getModelsForDirection(models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
        models,
        since,
        patientIdsForRegularSync,
        sessionId,
      );

      await removeEchoedChanges(store, sessionId);
    });

    return getOutgoingChangesCount(store, sessionId);
  }

  async getOutgoingChanges(store, sessionId, { offset, limit }) {
    const session = this.connectToSession(sessionId);
    return getOutgoingChangesForSession(
      store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
      offset,
      limit,
    );
  }

  async addIncomingChanges(sessionId, changes, { pageNumber, totalPages }, store) {
    const { sequelize, models } = store;
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
