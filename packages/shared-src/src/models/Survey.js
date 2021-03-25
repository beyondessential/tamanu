import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, SURVEY_TYPES } from 'shared/constants';
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
      },
      {
        ...options,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Program, {
      foreignKey: 'programId',
    });
    this.hasMany(models.SurveyScreenComponent, {
      as: 'components',
      foreignKey: 'surveyId',
    });
  }

  static syncDirection = SYNC_DIRECTIONS.PULL_ONLY;

  static getAllReferrals() {
    return this.findAll({
      where: { surveyType: SURVEY_TYPES.REFERRAL }
    });
  }
}
