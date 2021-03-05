import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class Survey extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: Sequelize.STRING,
        name: Sequelize.STRING,
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

  static syncDirection = SYNC_DIRECTIONS.READ_ONLY;
}
