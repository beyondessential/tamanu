import { DataTypes } from 'sequelize';
import { REFERRAL_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterPatientIdSelect } from '../sync/buildPatientLinkedLookupFilter';
import type { InitOptions, Models } from '../types/model';

export class Referral extends Model {
  declare id: string;
  declare referredFacility?: string;
  declare status: string;
  declare initiatingEncounterId?: string;
  declare completingEncounterId?: string;
  declare surveyResponseId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        referredFacility: DataTypes.STRING,
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: REFERRAL_STATUSES.PENDING,
        },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static getListReferenceAssociations() {
    return ['surveyResponse'];
  }

  static initRelations(models: Models) {
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

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
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
