import { v4 as uuidv4 } from 'uuid';

import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';

export class CentralSyncManager {
  sessions = {};

  async getCurrentBeat(sequelize) {
    const [[{ currval: currentBeat }]] = await sequelize.query(
      `SELECT currval('sync_beat_sequence')`,
    );
    return currentBeat.nextval;
  }

  async getNextBeat(sequelize) {
    const [[{ nextval: nextBeat }]] = await sequelize.query(`SELECT nextval('sync_beat_sequence')`);
    return nextBeat;
  }

  startSession() {
    const startTime = Date.now();
    const sessionId = uuidv4();
    this.sessions[sessionId] = {
      startTime,
    };
    return sessionId;
  }

  startIncomingSession() {
    const sessionId = this.startSession();
    this.sessions[sessionId].incomingChanges = [];
    return { sessionId };
  }

  async startOutgoingSession(models, since) {
    const sessionId = this.startSession();
    const changes = await snapshotOutgoingChanges(
      getModelsForDirection(models, SYNC_DIRECTIONS.CENTRAL_TO_FACILITY),
      since,
    );
    this.sessions[sessionId].outgoingChanges = changes;
    return { sessionId, count: changes.length };
  }

  async endSession(sequelize, models, sessionId) {
    if (!this.sessions[sessionId]) {
      throw new Error(`Sync session ${sessionId} not found`);
    }

    // persist any incoming changes to the db
    const { incomingChanges } = this.sessions[sessionId];
    if (incomingChanges) {
      await saveIncomingChanges(
        sequelize,
        getModelsForDirection(models, SYNC_DIRECTIONS.FACILITY_TO_CENTRAL),
        incomingChanges,
      );
    }

    delete this.sessions[sessionId];
  }

  getOutgoingChanges(sessionId, { offset, limit }) {
    if (!this.sessions[sessionId]) {
      throw new Error(`Sync session ${sessionId} not found`);
    }
    return this.sessions[sessionId].outgoingChanges.slice(offset, offset + limit);
  }

  addIncomingChanges(sessionId, changes) {
    if (!this.sessions[sessionId]) {
      throw new Error(`Sync session ${sessionId} not found`);
    }
    this.sessions[sessionId].incomingChanges.push(...changes);
  }
}
