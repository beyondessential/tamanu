import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, SURVEY_TYPES } from '../constants';
import { Model } from './Model';

export class Survey extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: Sequelize.STRING,
        name: Sequelize.STRING,
        surveyType: {
          type: Sequelize.STRING,
          defaultValue: SURVEY_TYPES.PROGRAMS,
        },
        isSensitive: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
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

  static initRelations(models) {
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

  static async getResponsePermissionCheck(id) {
    const vitalsSurvey = await this.getVitalsSurvey();
    if (vitalsSurvey && id === vitalsSurvey.id) {
      return 'Vitals';
    }
    return 'SurveyResponse';
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
