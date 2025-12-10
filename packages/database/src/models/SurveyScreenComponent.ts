import { Op, DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { safeJsonParse } from '@tamanu/utils/safeJsonParse';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { ProgramDataElement } from './ProgramDataElement';

export class SurveyScreenComponent extends Model {
  declare id: string;
  declare screenIndex?: number;
  declare componentIndex?: number;
  declare text?: string;
  declare visibilityCriteria?: string;
  declare validationCriteria?: string;
  declare detail?: string;
  declare config?: string;
  declare options?: string;
  declare calculation?: string;
  declare visibilityStatus?: string;
  declare surveyId?: string;
  declare dataElementId?: string;
  declare dataElement?: ProgramDataElement;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        screenIndex: DataTypes.INTEGER,
        componentIndex: DataTypes.INTEGER,
        text: DataTypes.STRING,
        visibilityCriteria: DataTypes.STRING,
        validationCriteria: DataTypes.TEXT,
        detail: DataTypes.STRING,
        config: DataTypes.STRING,
        options: DataTypes.TEXT,
        calculation: DataTypes.STRING,
        visibilityStatus: DataTypes.STRING,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static getListReferenceAssociations(includeAllVitals: any) {
    return {
      model: this.sequelize.models.ProgramDataElement,
      as: 'dataElement',
      paranoid: !includeAllVitals,
    };
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
    });
    this.belongsTo(models.ProgramDataElement, {
      foreignKey: 'dataElementId',
      as: 'dataElement',
    });
  }

  static async getComponentsForSurveys(
    surveyIds: string[],
    options: { includeAllVitals?: boolean } = {},
  ) {
    const { includeAllVitals } = options;
    const where = {
      surveyId: {
        [Op.in]: surveyIds,
      },
    };

    const components = await this.findAll({
      where,
      include: this.getListReferenceAssociations(includeAllVitals),
      order: [
        ['screen_index', 'ASC'],
        ['component_index', 'ASC'],
      ],
      paranoid: !includeAllVitals,
    });

    return components.map(c => c.forResponse());
  }

  static getComponentsForSurvey(surveyId: string, options = {}) {
    return this.getComponentsForSurveys([surveyId], options);
  }

  forResponse() {
    const { options, ...values } = this.dataValues;
    return {
      ...values,
      options: safeJsonParse(options),
    };
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
