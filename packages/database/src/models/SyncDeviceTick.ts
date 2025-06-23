import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

export class SyncDeviceTick extends Model {
  declare id: number;
  declare persistedAtSyncTick: number;
  declare deviceId?: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: {
          // Sequelize always requires an id column
          // so this is to enforce using persisted_at_sync_tick as the id.
          // even tho we don't really need an id in this table.
          // We don't use the value of persisted_at_sync_tick in id
          // just so that it is clear about the type of tick that it is storing.
          type: `BIGINT GENERATED ALWAYS AS ("persisted_at_sync_tick")`,
          set() {
            // any sets of the convenience generated "id" field can be ignored, so do nothing here
          },
        },
        persistedAtSyncTick: { type: DataTypes.BIGINT, primaryKey: true },
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
