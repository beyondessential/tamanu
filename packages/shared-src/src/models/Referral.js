import { Sequelize } from 'sequelize';
import { REFERRAL_STATUSES, SYNC_DIRECTIONS } from 'shared/constants';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';

export class Referral extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        referredFacility: Sequelize.STRING,
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: REFERRAL_STATUSES.PENDING,
        },
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
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

  static buildSyncFilter(patientIds, sessionConfig) {
    return buildEncounterLinkedSyncFilter(this, patientIds, sessionConfig, ['initiatingEncounter']);
  }
}
