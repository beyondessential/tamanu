import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class SurveyResponse extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
    });
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
    });
  }
}

export class SurveyResponseAnswer extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: Sequelize.STRING,
        body: Sequelize.STRING,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ProgramDataElement, {
      foreignKey: 'dataElementId',
    });

    this.belongsTo(models.SurveyResponse, {
      foreignKey: 'responseId',
    });
  }
}
