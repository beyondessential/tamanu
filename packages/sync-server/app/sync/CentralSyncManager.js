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

  store;

  sessionsUndergoingSnapshot = new Set();

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

  async tickTockGlobalClock() {
    // rather than just incrementing by one tick, we "tick, tock" the clock inside a transaction,
    // so we guarantee the "tick" part to be unique to the requesting client, and any changes made
    // directly on the central server will be recorded as updated at the "tock", avoiding any
    // direct changes (e.g. imports) being missed by a client that is at the same sync tick
    const tickTock = await this.store.sequelize.transaction(async () => {
      const [[{ nextval: tick }]] = await this.store.sequelize.query(
        `SELECT nextval('sync_clock_sequence')`,
      );
      const [[{ nextval: tock }]] = await this.store.sequelize.query(
        `SELECT nextval('sync_clock_sequence')`,
      );
      return { tick, tock };
    });
    return tickTock;
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

    return syncSession.id;
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
    this.sessionsUndergoingSnapshot.add(sessionId);

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

    this.sessionsUndergoingSnapshot.delete(sessionId);
  }

  async fetchPullCount(sessionId) {
    await this.connectToSession(sessionId);
    if (this.sessionsUndergoingSnapshot.has(sessionId)) {
      return null;
    }
    return getOutgoingChangesCount(this.store, sessionId);
  }

  async getOutgoingChanges(sessionId, { offset, limit }) {
    await this.connectToSession(sessionId);
    return getOutgoingChangesForSession(
      this.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
      offset,
      limit,
    );
  }

  async addIncomingChanges(sessionId, changes, { pushedSoFar, totalToPush }) {
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

    if (pushedSoFar === totalToPush) {
      // commit the changes to the db
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
