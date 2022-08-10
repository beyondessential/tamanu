import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { log } from 'shared/services/logging';
import { getPatientLinkedModels } from './getPatientLinkedModels';

// after 10 minutes of no activity, consider a session lapsed and wipe it to avoid holding invalid
// changes in memory when a sync fails on the facility server end
const LAPSE_AFTER_MILLISECONDS = 10 * 60 * 1000;
const CHECK_LAPSED_SESSIONS_INTERVAL = 1 * 60 * 1000; // check once per minute

export class CentralSyncManager {
  sessions = {};

  constructor() {
    setInterval(this.purgeLapsedSessions, CHECK_LAPSED_SESSIONS_INTERVAL);
  }

  purgeLapsedSessions = () => {
    const oldestValidTime = Date.now() - LAPSE_AFTER_MILLISECONDS;
    const lapsedSessions = Object.keys(this.sessions).filter(
      sessionIndex => this.sessions[sessionIndex].lastConnectionTime < oldestValidTime,
    );
    lapsedSessions.forEach(sessionIndex => delete this.sessions[sessionIndex]);
  };

  async startSession({ sequelize }) {
    const startTime = Date.now();
    const [[{ nextval: sessionIndex }]] = await sequelize.query(
      `SELECT nextval('sync_session_sequence')`,
    );
    this.sessions[sessionIndex] = {
      startTime,
      lastConnectionTime: startTime,
      incomingChanges: [],
    };
    return sessionIndex;
  }

  connectToSession(sessionIndex) {
    const session = this.sessions[sessionIndex];
    if (!session) {
      throw new Error(`Sync session ${sessionIndex} not found`);
    }
    session.lastConnectionTime = Date.now();
    return session;
  }

  async endSession(sessionIndex) {
    const session = this.connectToSession(sessionIndex);
    log.info(
      `Sync session performed ${session.incomingChanges.length} incoming and ${
        session.outgoingChanges.length
      } outgoing changes in ${(Date.now() - session.startTime) / 1000} seconds`,
    );
    delete this.sessions[sessionIndex];
  }

  async setPullFilter(sessionIndex, { fromSessionIndex, facilityId }, { models }) {
    const session = this.connectToSession(sessionIndex);

    // work out if any patients were newly marked for sync
    const { incomingChanges } = session;
    const patientIdsForFullSync = incomingChanges
      .filter(c => c.recordType === 'patient_facilities' && !c.isDeleted)
      .map(c => c.data.patientId);

    // get changes from all time associated with patients that were marked for sync in this session
    const fullSyncChanges = await snapshotOutgoingChanges(
      getPatientLinkedModels(models),
      0,
      patientIdsForFullSync,
    );

    // get changes since the last successful sync for all other synced patients and independent
    // record types
    const patientFacilities = await models.PatientFacility.findAll({ where: { facilityId } });
    const patientIdsForRegularSync = patientFacilities
      .map(p => p.patientId)
      .filter(patientId => !patientIdsForFullSync.includes(patientId));
    const regularChanges = await snapshotOutgoingChanges(
      getModelsForDirection(models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
      fromSessionIndex,
      patientIdsForRegularSync,
    );

    const changes = [...fullSyncChanges, ...regularChanges];

    // filter out any changes that were pushed in during the same sync session
    const incomingChangesByUniqueKey = Object.fromEntries(
      incomingChanges.map(c => [`${c.recordType}_${c.data.id}`, c]),
    );
    const changesWithoutEcho = changes.filter(c => {
      // if the detected change just came in, and the updated marker indicates that it hasn't
      // changed since, don't send it back down to the same facility that sent it
      const sameIncomingChange = incomingChangesByUniqueKey[`${c.recordType}_${c.data.id}`];
      if (
        sameIncomingChange &&
        sameIncomingChange.data.updatedAtSyncIndex === c.data.updatedAtSyncIndex
      ) {
        return false;
      }

      return true;
    });
    session.outgoingChanges = changesWithoutEcho;

    return changesWithoutEcho.length;
  }

  getOutgoingChanges(sessionIndex, { offset, limit }) {
    const session = this.connectToSession(sessionIndex);
    return session.outgoingChanges.slice(offset, offset + limit);
  }

  async addIncomingChanges(
    sessionIndex,
    changes,
    { pageNumber, totalPages },
    { sequelize, models },
  ) {
    const session = this.connectToSession(sessionIndex);
    session.incomingChanges.push(...changes);
    if (pageNumber === totalPages) {
      await saveIncomingChanges(
        sequelize,
        getModelsForDirection(models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL),
        session.incomingChanges,
        true,
      );
    }
  }
}
