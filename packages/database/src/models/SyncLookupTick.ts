import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

export class SyncLookupTick extends Model {
  declare id: number;
  declare sourceStartTick: number;
  declare lookupEndTick: number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: {
          // Sequelize always requires an id column
          // so this is to enforce using lookup_end_tick as the id.
          // even tho we don't really need an id in this table.
          // We don't use the value of lookup_end_tick in id
          // just so that it is clear about the type of tick that it is storing.
          type: `BIGINT GENERATED ALWAYS AS ("lookup_end_tick")`,
          set() {
            // any sets of the convenience generated "id" field can be ignored, so do nothing here
          },
        },
        sourceStartTick: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        lookupEndTick: {
          type: DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true,
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
