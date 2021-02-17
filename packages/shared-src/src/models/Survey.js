import { Sequelize } from 'sequelize';
import { PROGRAM_DATA_ELEMENT_TYPE_VALUES } from '../constants';
import { Model } from './Model';

function parseOrNull(s) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

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
}

export class SurveyScreenComponent extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        screenIndex: Sequelize.INTEGER,
        componentIndex: Sequelize.INTEGER,
        text: Sequelize.STRING,
        visibilityCriteria: Sequelize.STRING,
        validationCriteria: Sequelize.STRING,
        detail: Sequelize.STRING,
        config: Sequelize.STRING,
        options: Sequelize.STRING,
        calculation: Sequelize.STRING,
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

  forResponse() {
    const { options, ...values } = this.dataValues;
    return {
      ...values,
      options: parseOrNull(options),
    };
  }
}

export class ProgramDataElement extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: Sequelize.STRING,
        name: Sequelize.STRING,
        indicator: Sequelize.STRING,
        defaultText: Sequelize.STRING,
        defaultOptions: Sequelize.STRING,
        type: Sequelize.ENUM(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
      },
      {
        ...options,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  forResponse() {
    const { defaultOptions, ...values } = this.dataValues;
    return {
      ...values,
      defaultOptions: parseOrNull(defaultOptions),
    };
  }
}
