import { Op } from 'sequelize';
import { Model } from './Model';

export class SurveyScreenComponent extends Model {
  static async getComponentsForSurveys(surveyIds: string[], options: Record<string, any> = {}) {
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

  static getComponentsForSurvey(surveyId: string, options: Record<string, any> = {}) {
    return this.getComponentsForSurveys([surveyId], options);
  }
}
