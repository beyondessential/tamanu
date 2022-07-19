import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { getPatientLinkedModels } from './getPatientLinkedModels';

export class CentralSyncManager {
  sessions = {};

  async startSession({ sequelize }) {
    const startTime = Date.now();
    const [[{ nextval: sessionIndex }]] = await sequelize.query(
      `SELECT nextval('sync_session_sequence')`,
    );
    this.sessions[sessionIndex] = {
      startTime,
      incomingChanges: [],
    };
    return sessionIndex;
  }

  async endSession(sessionIndex) {
    if (!this.sessions[sessionIndex]) {
      throw new Error(`Sync session ${sessionIndex} not found`);
    }
    delete this.sessions[sessionIndex];
  }

  async setPullFilter(sessionIndex, { fromSessionIndex, facilityId }, { models }) {
    // work out if any patients were newly marked for sync
    const { incomingChanges } = this.sessions[sessionIndex];
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
      getModelsForDirection(models, SYNC_DIRECTIONS.CENTRAL_TO_FACILITY),
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
    this.sessions[sessionIndex].outgoingChanges = changesWithoutEcho;

    return changesWithoutEcho.length;
  }

  getOutgoingChanges(sessionIndex, { offset, limit }) {
    if (!this.sessions[sessionIndex]) {
      throw new Error(`Sync session ${sessionIndex} not found`);
    }
    return this.sessions[sessionIndex].outgoingChanges.slice(offset, offset + limit);
  }

  async addIncomingChanges(
    sessionIndex,
    changes,
    { pageNumber, totalPages },
    { sequelize, models },
  ) {
    if (!this.sessions[sessionIndex]) {
      throw new Error(`Sync session ${sessionIndex} not found`);
    }
    this.sessions[sessionIndex].incomingChanges.push(...changes);
    if (pageNumber === totalPages) {
      await saveIncomingChanges(
        sequelize,
        getModelsForDirection(models, SYNC_DIRECTIONS.FACILITY_TO_CENTRAL),
        this.sessions[sessionIndex].incomingChanges,
        true,
      );
    }
  }
}
