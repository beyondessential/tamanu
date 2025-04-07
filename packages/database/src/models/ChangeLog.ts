import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class ChangeLog extends Model {
  declare id: number;
  declare tableOid: number;
  declare tableSchema: string;
  declare tableName: string;
  declare loggedAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | undefined;
  declare updatedAtSyncTick: number;
  declare updatedByUserId: string;
  declare recordId: string;
  declare recordUpdate: boolean;
  declare recordData: Record<string, any>;

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
        recordUpdate: {
          type: DataTypes.BOOLEAN,
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
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        schema: 'logs',
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'updatedByUserId',
      as: 'user',
    });
  }
}
