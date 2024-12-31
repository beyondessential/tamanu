import { Sequelize } from 'sequelize';
import { REFERRAL_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterPatientIdSelect } from '../sync/buildPatientLinkedLookupFilter';

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

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return `
      JOIN encounters ON referrals.initiating_encounter_id = encounters.id
      WHERE encounters.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
      AND ${this.tableName}.updated_at_sync_tick > :since
    `;
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildEncounterPatientIdSelect(this),
      joins: 'JOIN encounters ON referrals.initiating_encounter_id = encounters.id',
    };
  }
}
