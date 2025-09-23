import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class DHIS2PushLog extends Model {
  declare id: string;
  declare reportId: string;
  declare status: string;
  declare imported: number;
  declare updated: number;
  declare ignored: number;
  declare deleted: number;
  declare conflicts: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        reportId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        imported: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        updated: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ignored: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        deleted: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        conflicts: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },

      {
        ...options,
        tableName: 'dhis2_pushes',
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        schema: 'logs',
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ReportDefinition, {
      foreignKey: 'reportId',
      as: 'user',
    });
  }
}
