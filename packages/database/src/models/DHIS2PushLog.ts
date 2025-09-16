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
  declare conflicts: string[];
  declare createdAt: Date;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        reportId: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        status: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        imported: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        updated: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        ignored: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        deleted: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        conflicts: {
          type: DataTypes.BOOLEAN,
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
