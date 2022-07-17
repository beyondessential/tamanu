import { getModelsForDirection, snapshotOutgoingChanges, saveIncomingChanges } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';

export class CentralSyncManager {
  sessions = {};

  async startSession({ sequelize }) {
    const startTime = Date.now();
    const [[{ nextval: syncIndex }]] = await sequelize.query(
      `SELECT nextval('sync_index_sequence')`,
    );
    this.sessions[syncIndex] = {
      startTime,
      incomingChanges: [],
    };
    return syncIndex;
  }

  async endSession(syncIndex) {
    if (!this.sessions[syncIndex]) {
      throw new Error(`Sync session ${syncIndex} not found`);
    }
    delete this.sessions[syncIndex];
  }

  async setPullFilter(syncIndex, { since }, { models }) {
    const changes = await snapshotOutgoingChanges(
      getModelsForDirection(models, SYNC_DIRECTIONS.CENTRAL_TO_FACILITY),
      since,
    );
    this.sessions[syncIndex].outgoingChanges = changes;
    return changes.length;
  }

  getOutgoingChanges(syncIndex, { offset, limit }) {
    if (!this.sessions[syncIndex]) {
      throw new Error(`Sync session ${syncIndex} not found`);
    }
    return this.sessions[syncIndex].outgoingChanges.slice(offset, offset + limit);
  }

  async addIncomingChanges(syncIndex, changes, { pageNumber, totalPages }, { sequelize, models }) {
    if (!this.sessions[syncIndex]) {
      throw new Error(`Sync session ${syncIndex} not found`);
    }
    this.sessions[syncIndex].incomingChanges.push(...changes);
    if (pageNumber === totalPages) {
      await saveIncomingChanges(
        sequelize,
        getModelsForDirection(models, SYNC_DIRECTIONS.FACILITY_TO_CENTRAL),
        this.sessions[syncIndex].incomingChanges,
      );
    }
  }
}
