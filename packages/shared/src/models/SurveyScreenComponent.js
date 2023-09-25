import { Sequelize, Op } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { parseOrNull } from '../utils/parse-or-null';
import { log } from '../services/logging';
import { Model } from './Model';

export class SurveyScreenComponent extends Model {
  static deletedAt = {
    key: 'visibilityStatus',
    value: {
      softDeleted: VISIBILITY_STATUSES.HISTORICAL,
      active: VISIBILITY_STATUSES.CURRENT,
    },
  };

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
        [this.deletedAt.key]: Sequelize.STRING,
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

  static async getComponentsForSurveys(surveyIds) {
    const components = await this.findAll({
      where: {
        surveyId: {
          [Op.in]: surveyIds,
        },
      },
      include: this.getListReferenceAssociations(),
      order: [
        ['screen_index', 'ASC'],
        ['component_index', 'ASC'],
      ],
    });

    return components.map(c => c.forResponse());
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

  // Manually defines the special column to filter out soft deleted records.
  static async findAll(options) {
    const { where = {} } = { ...options };

    if (!where.hasOwnProperty(this.deletedAt.key)) {
      where[this.deletedAt.key] = VISIBILITY_STATUSES.CURRENT;
    }
    return super.findAll({ ...options, where });
  }

  async destroy() {
    const id = await this.get('id');

    return this.update(
      {
        [SurveyScreenComponent.deletedAt.key]: SurveyScreenComponent.deletedAt.value.softDeleted,
      },
      {
        where: { id },
      },
    );
  }

  async restore() {
    const id = await this.get('id');

    return this.update(
      {
        [SurveyScreenComponent.deletedAt.key]: SurveyScreenComponent.deletedAt.value.active,
      },
      {
        where: { id },
      },
    );
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
