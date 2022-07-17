import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';

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

  async setPullFilter(sessionIndex, { sinceSessionIndex }, { models }) {
    const changes = await snapshotOutgoingChanges(
      getModelsForDirection(models, SYNC_DIRECTIONS.CENTRAL_TO_FACILITY),
      sinceSessionIndex,
    );

    // filter out any changes that were pushed in during the same sync session
    const { incomingChanges } = this.sessions[sessionIndex];
    const incomingChangeDataById = Object.fromEntries(
      incomingChanges.map(c => [c.data.id, c.data]),
    );
    const changesWithoutEcho = changes.filter(
      c =>
        !incomingChangeDataById[c.data.id] ||
        incomingChangeDataById[c.data.id].updatedSinceSession !== c.data.updatedSinceSession,
    );
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
      );
    }
  }
}
