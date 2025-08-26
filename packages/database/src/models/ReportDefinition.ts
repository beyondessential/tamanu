import { DataTypes } from 'sequelize';
import { REPORT_DB_SCHEMAS, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class ReportDefinition extends Model {
  declare id: string;
  declare name: string;
  declare dbSchema: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        dbSchema: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: REPORT_DB_SCHEMAS.REPORTING,
          validate: {
            isIn: [Object.values(REPORT_DB_SCHEMAS)],
          },
        },
      },
      {
        ...options,
        indexes: [{ unique: true, fields: ['name'] }],
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.hasMany(models.ReportDefinitionVersion, { as: 'versions' });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
