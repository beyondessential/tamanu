import { DataTypes, Sequelize } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class AccessLog extends Model {
  declare id: string;
  declare tableOid: number;
  declare tableSchema: string;
  declare tableName: string;
  declare loggedAt: Date;
  declare updatedByUserId: string;
  declare recordId: string;
  declare recordUpdate: boolean;
  declare recordCreatedAt: Date;
  declare recordUpdatedAt: Date;
  declare recordDeletedAt: Date | null;
  declare recordSyncTick: number;
  declare recordData: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
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
        loggedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('adjusted_timestamp'),
        },
        updatedByUserId: {
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
        recordCreatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        recordUpdatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        recordDeletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
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
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
        schema: 'logs',
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'updatedByUserId',
      as: 'updatedByUser',
    });
  }
}
