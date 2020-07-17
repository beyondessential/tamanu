import { Sequelize } from 'sequelize';
import { Model } from './Model';

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

export class SurveyScreenComponent extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        screenIndex: Sequelize.INTEGER,
        componentIndex: Sequelize.INTEGER,
      },
      options,
    );
  }

  static getListReferenceAssociations() {
    return ['question'];
  }

  static initRelations(models) {
    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
    });
    this.belongsTo(models.SurveyQuestion, {
      foreignKey: 'questionId',
      as: 'question',
    });
  }

  static getComponentsForSurvey(surveyId) {
    return this.findAll({
      where: { surveyId },
      include: this.getListReferenceAssociations(),
    }).map(c => c.forResponse());
  }
}

const QUESTION_TYPE_VALUES = ['number', 'string'];

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
}
