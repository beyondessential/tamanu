import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions } from '../types/model';

export class MSupplyPushLog extends Model {
  declare id: string;
  declare status: string;
  declare message?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        min_created_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        max_created_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },

      {
        ...options,
        tableName: 'm_supply_pushes',
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL, // TODO: Check if this is correct or if we want do not sync
        schema: 'logs',
      },
    );
  }
}
