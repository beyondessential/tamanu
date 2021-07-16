import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class Referral extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        referredFacility: Sequelize.STRING,
      },
      options,
    );
  }

  static getListReferenceAssociations() {
    return ['surveyResponse'];
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'initiatingEncounterId',
      as: 'initiatingEncounter',
    });
    this.belongsTo(models.Encounter, {
      foreignKey: 'completingEncounterId',
      as: 'completingEncounter',
    });
    this.belongsTo(models.SurveyResponse, {
      foreignKey: 'surveyResponseId',
      as: 'surveyResponse',
    });
  }
}
