import { Sequelize } from 'sequelize';
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
        indexes: [
          { unique: true, fields: ['code'] }
        ],
      }
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
        text: Sequelize.STRING,
        options: Sequelize.STRING,
      },
      options,
    );
  }

  static getListReferenceAssociations() {
    return ['dataElement'];
  }

  static initRelations(models) {
    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
    });
    this.belongsTo(models.ProgramDataElement, {
      foreignKey: 'dataElementId',
      as: 'dataElement',
    });
  }

  static getComponentsForSurvey(surveyId) {
    return this.findAll({
      where: { surveyId },
      include: this.getListReferenceAssociations(),
    }).map(c => c.forResponse());
  }
}

const DATA_ELEMENT_TYPE_VALUES = ['number', 'text'];

export class ProgramDataElement extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: Sequelize.STRING,
        name: Sequelize.STRING,
        defaultText: Sequelize.STRING,
        defaultOptions: Sequelize.STRING,
        type: Sequelize.ENUM(DATA_ELEMENT_TYPE_VALUES),
      },
      {
        ...options,
        indexes: [
          { unique: true, fields: ['code'] }
        ],
      }
    );
  }
}
