import { v4 as uuidv4 } from 'uuid';

import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';

export class CentralSyncManager {
  sessions = {};

  constructor(models) {
    this.models = models;
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

  async startOutgoingSession(since) {
    const sessionId = this.startSession();
    const changes = await snapshotOutgoingChanges(
      getModelsForDirection(this.models, SYNC_DIRECTIONS.CENTRAL_TO_FACILITY),
      since,
    );
    this.session[sessionId].outgoingChanges = changes;
    return { sessionId, count: changes.length };
  }

  async endSession(sessionId) {
    if (!this.sessions[sessionId]) {
      throw new Error(`Sync session ${sessionId} not found`);
    }

    // persist any incoming changes to the db
    const { incomingChanges } = this.sessions[sessionId];
    if (incomingChanges) {
      await saveIncomingChanges(
        getModelsForDirection(this.models, SYNC_DIRECTIONS.FACILITY_TO_CENTRAL),
        changes,
      );
    }

    delete this.sessions[sessionId];
  }

  getOutgoingChanges(sessionId, { offset, limit }) {
    if (!this.sessions[sessionId]) {
      throw new Error(`Sync session ${sessionId} not found`);
    }
    return this.sessions[sessionId].slice(offset, offset + limit);
  }

  addIncomingChanges(sessionId, changes) {
    if (!this.sessions[sessionId]) {
      throw new Error(`Sync session ${sessionId} not found`);
    }
    this.sessions[sessionId].incomingChanges.push(...changes);
  }
}
