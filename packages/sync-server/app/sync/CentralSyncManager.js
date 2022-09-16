import { Op } from 'sequelize';
import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { generateId } from 'shared/utils';
import { log } from 'shared/services/logging';
import { getPatientLinkedModels } from './getPatientLinkedModels';

// after 10 minutes of no activity, consider a session lapsed and wipe it to avoid holding invalid
// changes in memory when a sync fails on the facility server end
const LAPSE_AFTER_MILLISECONDS = 10 * 60 * 1000;
const CHECK_LAPSED_SESSIONS_INTERVAL = 1 * 60 * 1000; // check once per minute

export class CentralSyncManager {
  currentSyncTick;

  sessions = {};

  constructor() {
    setInterval(this.purgeLapsedSessions, CHECK_LAPSED_SESSIONS_INTERVAL);
  }

  purgeLapsedSessions = () => {
    const oldestValidTime = Date.now() - LAPSE_AFTER_MILLISECONDS;
    const lapsedSessions = Object.keys(this.sessions).filter(
      sessionId => this.sessions[sessionId].lastConnectionTime < oldestValidTime,
    );
    lapsedSessions.forEach(sessionId => delete this.sessions[sessionId]);
  };

  async startSession({ sequelize }) {
    // as a side effect of starting a new session, cause a tick on the global sync clock
    // this is a convenient way to tick the clock, as it means that no two sync sessions will
    // happen at the same global sync time, meaning there's no ambiguity when resolving conflicts
    const [[{ nextval: syncClockTick }]] = await sequelize.query(
      `SELECT nextval('sync_clock_sequence')`,
    );

    // instantiate the session
    const startTime = Date.now();
    const sessionId = generateId(); // TEMPORARY the id will be replaced with a full db UUID in EPI-137
    this.sessions[sessionId] = {
      startTime,
      lastConnectionTime: startTime,
      incomingChanges: [],
    };
    return { sessionId, syncClockTick };
  }

  connectToSession(sessionId) {
    const session = this.sessions[sessionId];
    if (!session) {
      throw new Error(`Sync session ${sessionId} not found`);
    }
    session.lastConnectionTime = Date.now();
    return session;
  }

  async endSession(sessionId) {
    const session = this.connectToSession(sessionId);
    log.info('Sync session ended', { 
      time: Date.now() - session.startTime,
      incomingChanges: incomingChanges.length,
      outgoingChanges: outgoingChanges.length
    });
    delete this.sessions[sessionId];
  }

  // The hardest thing about sync is knowing what happens at the clock tick border - do we want
  // records strictly >, or >= the cursor being requested? The truth is, it doesn't matter! A given
  // tick is unique to one device, and gets updated at the end of its sync session, so if a device
  // is requesting records "since" tick x, we know that it only has records from the central server
  // that are _below_ that tick, but also has all records locally _at_ that tick already - it must
  // have been the one that changed them, if they have an update tick unique to that device!
  // For sanity's sake, we use > consistently, because it aligns with "since"
  async setPullFilter(sessionId, { since, facilityId }, { models }) {
    const session = this.connectToSession(sessionId);

    const facilitySettings = await models.Setting.forFacility(facilityId);

    // work out if any patients were newly marked for sync since this device last connected, and
    // include changes from all time for those patients
    const newPatientFacilities = await models.PatientFacility.findAll({
      where: { facilityId, updatedAtSyncTick: { [Op.gt]: since } },
    });
    const patientIdsForFullSync = newPatientFacilities.map(n => n.patientId);
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
      since,
      patientIdsForRegularSync,
      facilitySettings,
    );

    const changes = [...fullSyncChanges, ...regularChanges];

    // filter out any changes that were pushed in during the same sync session
    const { incomingChanges } = session;
    const incomingChangesByUniqueKey = Object.fromEntries(
      incomingChanges.map(c => [`${c.recordType}_${c.data.id}`, c]),
    );
    const changesWithoutEcho = changes.filter(c => {
      // if the detected change just came in, and the updated marker indicates that it hasn't
      // changed since, don't send it back down to the same device that sent it
      const sameIncomingChange = incomingChangesByUniqueKey[`${c.recordType}_${c.data.id}`];
      if (
        sameIncomingChange &&
        sameIncomingChange.data.updatedAtSyncTick === c.data.updatedAtSyncTick
      ) {
        return false;
      }

      return true;
    });
    session.outgoingChanges = changesWithoutEcho;

    return changesWithoutEcho.length;
  }

  getOutgoingChanges(sessionId, { offset, limit }) {
    const session = this.connectToSession(sessionId);
    return session.outgoingChanges.slice(offset, offset + limit);
  }

  async addIncomingChanges(sessionId, changes, { pageNumber, totalPages }, { sequelize, models }) {
    const session = this.connectToSession(sessionId);
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
