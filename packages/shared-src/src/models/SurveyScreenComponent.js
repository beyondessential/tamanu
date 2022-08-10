import { Sequelize, Op } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { parseOrNull } from 'shared/utils/parse-or-null';
import { log } from 'shared/services/logging';
import { Model } from './Model';

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
        options: Sequelize.TEXT,
        calculation: Sequelize.STRING,
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PULL_ONLY },
      },
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

  static getComponentsForSurveys(surveyIds) {
    return this.findAll({
      where: {
        surveyId: {
          [Op.in]: surveyIds,
        },
      },
      include: this.getListReferenceAssociations(),
      order: ['screenIndex', 'componentIndex'],
    }).map(c => c.forResponse());
  }

  static getComponentsForSurvey(surveyId) {
    return this.getComponentsForSurveys([surveyId]);
  }

  getOptions() {
    try {
      const optionString = this.options || this.dataElement?.defaultOptions || '';
      if (!optionString) {
        return [];
      }
      const optionArray = JSON.parse(optionString);
      return Object.entries(optionArray).map(([label, value]) => ({ label, value }));
    } catch (e) {
      log.error(e);
      return [];
    }
  }

  forResponse() {
    const { options, ...values } = this.dataValues;
    return {
      ...values,
      options: parseOrNull(options),
    };
  }
}
