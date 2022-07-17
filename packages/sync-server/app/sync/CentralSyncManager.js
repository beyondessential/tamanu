import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';

export class CentralSyncManager {
  sessions = {};

  async startSession({ sequelize }) {
    const startTime = Date.now();
    const [[{ nextval: syncBeat }]] = await sequelize.query(
      `SELECT nextval('sync_index_sequence')`,
    );
    this.sessions[syncBeat] = {
      startTime,
      incomingChanges: [],
    };
    return syncBeat;
  }

  async endSession(syncBeat) {
    if (!this.sessions[syncBeat]) {
      throw new Error(`Sync session ${syncBeat} not found`);
    }
    delete this.sessions[syncBeat];
  }

  async setPullFilter(syncBeat, { cursor }, { models }) {
    const changes = await snapshotOutgoingChanges(
      getModelsForDirection(models, SYNC_DIRECTIONS.CENTRAL_TO_FACILITY),
      cursor,
    );
    this.sessions[syncBeat].outgoingChanges = changes;
    return changes.length;
  }

  getOutgoingChanges(syncBeat, { offset, limit }) {
    if (!this.sessions[syncBeat]) {
      throw new Error(`Sync session ${syncBeat} not found`);
    }
    return this.sessions[syncBeat].outgoingChanges.slice(offset, offset + limit);
  }

  async addIncomingChanges(syncBeat, changes, { pageNumber, totalPages }, { sequelize, models }) {
    if (!this.sessions[syncBeat]) {
      throw new Error(`Sync session ${syncBeat} not found`);
    }
    this.sessions[syncBeat].incomingChanges.push(...changes);
    if (pageNumber === totalPages) {
      await saveIncomingChanges(
        sequelize,
        getModelsForDirection(models, SYNC_DIRECTIONS.FACILITY_TO_CENTRAL),
        this.sessions[syncBeat].incomingChanges,
      );
    }
  }
}
