import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions } from '../types/model';

export class MSupplyPushLog extends Model {
  declare id: string;
  declare status: string;
  declare message?: string;
  declare items?: unknown[];
  declare minMedicationCreatedAt: Date;
  declare maxMedicationCreatedAt: Date;
  declare minMedicationId: string;
  declare maxMedicationId: string;

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
        items: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        minMedicationCreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        maxMedicationCreatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        minMedicationId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        maxMedicationId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },

      {
        ...options,
        tableName: 'm_supply_pushes',
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
        schema: 'logs',
      },
    );
  }
}
