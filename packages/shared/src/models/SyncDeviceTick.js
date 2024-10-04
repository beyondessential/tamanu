import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class SyncDeviceTick extends Model {
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
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        timestamps: false,
      },
    );
  }
}
