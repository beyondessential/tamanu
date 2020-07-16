import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class Program extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: Sequelize.STRING,
      },
      options,
    );
  }

  static initRelations(models) {
    this.hasMany(models.ProgramSurvey, { 
      as: 'surveys' 
    });
  }
}

export class Survey extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: Sequelize.STRING,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Program, {
      foreignKey: 'programId',
    });
  }
}

export class SurveyQuestionComponent extends Model {
  
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: Sequelize.STRING,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
    });
    this.belongsTo(models.SurveyQuestion, {
      foreignKey: 'questionId',
    });
  }
}

const QUESTION_TYPE_VALUES = [
  'number',
  'string',
];

export class SurveyQuestion extends Model {

  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: Sequelize.STRING,
        text: Sequelize.STRING,
        type: Sequelize.ENUM(QUESTION_TYPE_VALUES),
        options: Sequelize.STRING,
        
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.SurveyQuestionComponent, {
      foreignKey: 'componentId',
    });
  }
}

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


