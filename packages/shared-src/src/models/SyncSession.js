import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class SyncSession extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        startTime: { type: Sequelize.DATE },
        lastConnectionTime: { type: Sequelize.DATE },
        syncTick: { type: Sequelize.BIGINT },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  static initRelations(models) {
    this.hasMany(models.SessionSyncRecord, {
      foreignKey: 'sessionId',
    });
  }
}
