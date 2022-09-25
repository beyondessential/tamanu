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
import { getPatientLinkedModels } from './getPatientLinkedModels';

// after x minutes of no activity, consider a session lapsed and wipe it to avoid holding invalid
// changes in the database when a sync fails on the facility server end
const { lapsedSessionSeconds, lapsedSessionCheckFrequencySeconds } = config.sync;

export class CentralSyncManager {
  currentSyncTick;

  sessions = {};

  store;

  purgeInterval;

  constructor(ctx) {
    this.store = ctx.store;
    this.purgeInterval = setInterval(
      this.purgeLapsedSessions,
      lapsedSessionCheckFrequencySeconds * 1000,
    );
    ctx.onClose(this.close);
  }

  close = () => clearInterval(this.purgeInterval);

  purgeLapsedSessions = async () => {
    await deleteInactiveSyncSessions(this.store, lapsedSessionSeconds);
  };

  async startSession(facilityId) {
    // as a side effect of starting a new session, cause a tick on the global sync clock
    // this is a convenient way to tick the clock, as it means that no two sync sessions will
    // happen at the same global sync time, meaning there's no ambiguity when resolving conflicts
    const [[{ nextval: syncClockTick }]] = await this.store.sequelize.query(
      `SELECT nextval('sync_clock_sequence')`,
    );

    const startTime = new Date();
    const syncSession = await this.store.models.SyncSession.create({
      syncTick: syncClockTick,
      startTime,
      lastConnectionTime: startTime,
      // facilityId, TODO - needs migration and model edit
    });

    log.debug(
      `CentralSyncManager.startSession: Facility ${facilityId} started a new session ${syncSession.id}, at tick ${syncClockTick}`,
    );

    return { sessionId: syncSession.id, syncClockTick };
  }

  async connectToSession(sessionId) {
    const session = await this.store.sequelize.models.SyncSession.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Sync session '${sessionId}' not found`);
    }
    await session.update({ lastConnectionTime: Date.now() });

    return session;
  }

  async endSession(sessionId) {
    const session = await this.connectToSession(sessionId);
    log.info(
      `Sync session ${session.id} performed in ${(Date.now() - session.startTime) / 1000} seconds`,
    );
    await deleteSyncSession(this.store, sessionId);
  }

  async setPullFilter(sessionId, { since, facilityId }) {
    const { models } = this.store;

    await this.connectToSession(sessionId);

    const facilitySettings = await models.Setting.forFacility(facilityId);

    // work out if any patients were newly marked for sync since this device last connected, and
    // include changes from all time for those patients
    const newPatientFacilities = await models.PatientFacility.findAll({
      where: { facilityId, updatedAtSyncTick: { [Op.gt]: since } },
    });
    log.debug(
      `CentralSyncManager.setPullFilter: ${newPatientFacilities.length} patients newly marked for sync for ${facilityId}`,
    );
    const patientIdsForFullSync = newPatientFacilities.map(n => n.patientId);

    await this.store.sequelize.transaction(async () => {
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

      await removeEchoedChanges(this.store, sessionId);
    });

    return getOutgoingChangesCount(this.store, sessionId);
  }

  async getOutgoingChanges(sessionId, { offset, limit }) {
    this.connectToSession(sessionId);
    return getOutgoingChangesForSession(
      this.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
      offset,
      limit,
    );
  }

  async addIncomingChanges(sessionId, changes, { pageNumber, totalPages }) {
    const { models } = this.store;
    await this.connectToSession(sessionId);
    const sessionSyncRecords = changes.map(c => ({
      ...c,
      direction: SYNC_SESSION_DIRECTION.INCOMING,
      sessionId,
    }));

    log.debug(
      `CentralSyncManager.addIncomingChanges: Adding ${sessionSyncRecords.length} changes for ${sessionId}`,
    );
    await models.SessionSyncRecord.bulkCreate(sessionSyncRecords);

    if (pageNumber === totalPages) {
      await this.store.sequelize.transaction(async () => {
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
