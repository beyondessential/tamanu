import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { parseOrNull } from 'shared/utils/parse-or-null';
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

  static syncDirection = SYNC_DIRECTIONS.PULL_ONLY;
}
