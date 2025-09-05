import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { safeJsonParse } from '@tamanu/utils/safeJsonParse';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class ProgramDataElement extends Model {
  declare id: string;
  declare code?: string;
  declare name?: string;
  declare indicator?: string;
  declare defaultText?: string;
  declare defaultOptions?: string;
  declare visualisationConfig?: string;
  declare type: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: DataTypes.STRING,
        name: DataTypes.STRING,
        indicator: DataTypes.STRING,
        defaultText: DataTypes.STRING,
        defaultOptions: DataTypes.TEXT,
        visualisationConfig: DataTypes.TEXT,
        type: {
          type: DataTypes.STRING(31),
          allowNull: false,
        },
      },
      {
        ...options,
        indexes: [{ unique: true, fields: ['code'] }],
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.hasOne(models.SurveyScreenComponent, {
      foreignKey: 'dataElementId',
      as: 'surveyScreenComponent',
    });
  }

  forResponse() {
    const { defaultOptions, ...values } = this.dataValues;
    return {
      ...values,
      defaultOptions: safeJsonParse(defaultOptions),
    };
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
