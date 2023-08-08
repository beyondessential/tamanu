import { Sequelize } from 'sequelize';
import { REFERRAL_STATUSES, SYNC_DIRECTIONS } from '../constants';
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

  static buildPatientSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return `
      JOIN encounters ON referrals.initiating_encounter_id = encounters.id
      WHERE encounters.patient_id IN (:patientIds)
      AND ${this.tableName}.updated_at_sync_tick > :since
    `;
  }
}
