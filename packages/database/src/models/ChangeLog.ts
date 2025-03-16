import { DataTypes, Sequelize } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

/** Change logs (audit). This table must not be written to via Sequelize. */
export class ChangeLog extends Model {
  declare readonly id: string;
  declare readonly loggedAt: Date;
  declare readonly deviceId: string;
  declare readonly version: string;
  declare readonly tableOid: number;
  declare readonly tableSchema: string;
  declare readonly tableName: string;
  declare readonly recordId: string;
  declare readonly recordUpdate: string;
  declare readonly recordSyncTick: number;
  declare readonly recordData: Record<string, any>;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        loggedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('adjusted_timestamp'),
        },
        deviceId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        version: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        tableOid: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        tableSchema: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        tableName: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        recordId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        recordUpdate: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        recordSyncTick: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        recordData: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
      },
      {
        ...options,
        tableName: 'changes',
        schema: 'logs',
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'updatedBy',
    });
  }
}
