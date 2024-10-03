import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class SyncPersistedTickToDevice extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        persistedAtSyncTick: { type: DataTypes.BIGINT, primaryKey },
        deviceId: {
          type: DataTypes.TEXT,
        },
      },
      {
        ...options,
        tableName: 'sync_persisted_tick_to_device',
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        timestamps: false,
      },
    );
  }
}
