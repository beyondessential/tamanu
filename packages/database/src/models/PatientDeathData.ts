import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import { dateType, type InitOptions, type Models } from '../types/model';

export class PatientDeathData extends Model {
  id!: string;
  birthWeight?: number;
  carrierAge?: number;
  carrierPregnancyWeeks?: number;
  externalCauseDate?: string;
  lastSurgeryDate?: string;
  externalCauseLocation?: string;
  externalCauseNotes?: string;
  fetalOrInfant?: boolean;
  hoursSurvivedSinceBirth?: number;
  manner?: string;
  pregnancyContributed?: string;
  recentSurgery?: string;
  stillborn?: string;
  wasPregnant?: string;
  withinDayOfBirth?: boolean;
  outsideHealthFacility?: boolean;
  primaryCauseTimeAfterOnset?: number;
  antecedentCause1TimeAfterOnset?: number;
  antecedentCause2TimeAfterOnset?: number;
  antecedentCause3TimeAfterOnset?: number;
  isFinal?: boolean;
  visibilityStatus!: string;
  patientId?: string;
  clinicianId?: string;
  facilityId?: string;
  primaryCauseConditionId?: string;
  antecedentCause1ConditionId?: string;
  antecedentCause2ConditionId?: string;
  antecedentCause3ConditionId?: string;
  lastSurgeryReasonId?: string;
  carrierExistingConditionId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        birthWeight: { type: DataTypes.INTEGER, unsigned: true } as any,
        carrierAge: { type: DataTypes.INTEGER, unsigned: true } as any,
        carrierPregnancyWeeks: { type: DataTypes.INTEGER, unsigned: true } as any,
        externalCauseDate: dateType('externalCauseDate'),
        lastSurgeryDate: dateType('lastSurgeryDate'),
        externalCauseLocation: DataTypes.STRING,
        externalCauseNotes: DataTypes.TEXT,
        fetalOrInfant: DataTypes.BOOLEAN, // true/false/null
        hoursSurvivedSinceBirth: { type: DataTypes.INTEGER, unsigned: true } as any,
        manner: DataTypes.STRING,
        pregnancyContributed: DataTypes.STRING, // yes/no/unknown/null
        recentSurgery: DataTypes.STRING, // yes/no/unknown/null
        stillborn: DataTypes.STRING, // yes/no/unknown/null
        wasPregnant: DataTypes.STRING, // yes/no/unknown/null
        withinDayOfBirth: DataTypes.BOOLEAN,
        outsideHealthFacility: DataTypes.BOOLEAN,
        primaryCauseTimeAfterOnset: DataTypes.INTEGER, // minutes
        antecedentCause1TimeAfterOnset: DataTypes.INTEGER, // minutes
        antecedentCause2TimeAfterOnset: DataTypes.INTEGER, // minutes
        antecedentCause3TimeAfterOnset: DataTypes.INTEGER, // minutes
        isFinal: DataTypes.BOOLEAN,
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        tableName: 'patient_death_data',
        validate: {
          mustHavePatient() {
            if (this.deletedAt) return;
            if (!this.patientId) {
              throw new InvalidOperationError('Patient death data must have a patient.');
            }
          },
          mustHaveClinician() {
            if (this.deletedAt) return;
            if (!this.clinicianId) {
              throw new InvalidOperationError('Patient death data must have a clinician.');
            }
          },
          yesNoUnknownFields() {
            if (this.deletedAt) return;
            for (const field of [
              'recentSurgery',
              'wasPregnant',
              'pregnancyContributed',
              'stillborn',
            ]) {
              if (this[field] && !['yes', 'no', 'unknown'].includes(this[field] as string)) {
                throw new InvalidOperationError(`${field} must be 'yes', 'no', 'unknown', or null`);
              }
            }
          },
        },
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
    });

    this.belongsTo(models.User, {
      foreignKey: 'clinicianId',
      as: 'clinician',
    });

    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });

    // conceptually "hasOne" but we want the foreign key to be here
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'primaryCauseConditionId',
      as: 'primaryCauseCondition',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'antecedentCause1ConditionId',
      as: 'antecedentCause1Condition',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'antecedentCause2ConditionId',
      as: 'antecedentCause2Condition',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'antecedentCause3ConditionId',
      as: 'antecedentCause3Condition',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'lastSurgeryReasonId',
      as: 'lastSurgeryReason',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'carrierExistingConditionId',
      as: 'carrierExistingCondition',
    });

    this.hasMany(models.ContributingDeathCause, {
      foreignKey: 'patientDeathDataId',
      as: 'contributingCauses',
    });
  }

  static buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
