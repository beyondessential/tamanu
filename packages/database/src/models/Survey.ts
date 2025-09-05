import { DataTypes, Op } from 'sequelize';
import { SURVEY_TYPES, SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class Survey extends Model {
  declare id: string;
  declare code?: string;
  declare name?: string;
  declare surveyType: string;
  declare isSensitive: boolean;
  declare visibilityStatus: string;
  declare notifiable: boolean;
  declare notifyEmailAddresses: string[];
  declare programId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: DataTypes.STRING,
        name: DataTypes.STRING,
        surveyType: {
          type: DataTypes.STRING,
          defaultValue: SURVEY_TYPES.PROGRAMS,
        },
        isSensitive: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        visibilityStatus: {
          type: DataTypes.STRING,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
          allowNull: false,
        },
        notifiable: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        notifyEmailAddresses: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
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
    this.belongsTo(models.Program, {
      foreignKey: 'programId',
      as: 'program',
    });
    this.hasMany(models.SurveyScreenComponent, {
      as: 'components',
      foreignKey: 'surveyId',
    });
  }

  static getAllReferrals() {
    return this.findAll({
      where: { surveyType: SURVEY_TYPES.REFERRAL },
    });
  }

  static getVitalsSurvey() {
    return this.findOne({
      where: { surveyType: SURVEY_TYPES.VITALS },
    });
  }

  static getChartSurveys() {
    return this.findAll({
      where: {
        surveyType: {
          [Op.in]: [
            SURVEY_TYPES.SIMPLE_CHART,
            SURVEY_TYPES.COMPLEX_CHART_CORE,
            SURVEY_TYPES.COMPLEX_CHART,
          ],
        },
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      order: [['name', 'ASC']],
    });
  }

  static async getResponsePermissionCheck(id: string) {
    const vitalsSurvey = await this.getVitalsSurvey();
    if (vitalsSurvey && id === vitalsSurvey.id) {
      return 'Vitals';
    }
    return 'SurveyResponse';
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
