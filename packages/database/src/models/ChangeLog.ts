import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class ChangeLog extends Model {
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
  declare recordData: string;
  declare deviceId: string;
  declare version: string;
  declare reason: string | null;
  declare migrationContext: string | null;

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
        },
        updatedByUserId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        recordId: {
          type: DataTypes.TEXT,
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
        recordData: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        deviceId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        version: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        migrationContext: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },

      {
        ...options,
        tableName: 'changes',
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        schema: 'logs',
        timestamps: false,
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
