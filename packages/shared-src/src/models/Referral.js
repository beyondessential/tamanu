import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

class Referral extends Model {
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
    });
    this.belongsTo(models.Encounter, {
      foreignKey: 'completingEncounterId',
    });
    this.belongsTo(models.SurveyResponse, {
      foreignKey: 'surveyResponseId',
    });
  }

}

exports.Referral = Referral;