import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class SyncSession extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        startTime: { type: DataTypes.DATE },
        lastConnectionTime: { type: DataTypes.DATE },
        snapshotCompletedAt: { type: DataTypes.DATE },
        error: { type: DataTypes.TEXT },
        debugInfo: { type: DataTypes.JSON },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  static initRelations(models) {
    this.hasMany(models.SyncSessionRecord, {
      foreignKey: 'sessionId',
    });
  }
}
