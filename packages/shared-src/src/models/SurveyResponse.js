import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
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
    this.belongsTo(models.SurveyQuestion, {
      foreignKey: 'questionId',
    });

    this.belongsTo(models.SurveyResponse, {
      foreignKey: 'responseId',
    });
  }
  
}


