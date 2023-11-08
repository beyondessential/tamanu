import { Sequelize, Op } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { parseOrNull } from '../utils/parse-or-null';
import { log } from '../services/logging';
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
        validationCriteria: Sequelize.TEXT,
        detail: Sequelize.STRING,
        config: Sequelize.STRING,
        options: Sequelize.TEXT,
        calculation: Sequelize.STRING,
        visibilityStatus: Sequelize.STRING,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
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

  static async getComponentsForSurveys(surveyIds, options = {}) {
    const { includeAllVitals } = options;
    const where = {
      surveyId: {
        [Op.in]: surveyIds,
      },
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    };

    if (includeAllVitals) {
      where.visibilityStatus = {
        [Op.in]: [VISIBILITY_STATUSES.CURRENT, VISIBILITY_STATUSES.HISTORICAL],
      };
    }

    const components = await this.findAll({
      where,
      include: this.getListReferenceAssociations(),
      order: [
        ['screen_index', 'ASC'],
        ['component_index', 'ASC'],
      ],
    });

    return components.map(c => c.forResponse());
  }

  static getComponentsForSurvey(surveyId, options = {}) {
    return this.getComponentsForSurveys([surveyId], options);
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

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
