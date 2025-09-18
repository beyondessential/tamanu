import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import { dateType, type InitOptions, type Models } from '../types/model';

export class PatientDeathData extends Model {
  declare id: string;
  declare birthWeight?: number;
  declare carrierAge?: number;
  declare carrierPregnancyWeeks?: number;
  declare externalCauseDate?: string;
  declare lastSurgeryDate?: string;
  declare externalCauseLocation?: string;
  declare externalCauseNotes?: string;
  declare fetalOrInfant?: boolean;
  declare hoursSurvivedSinceBirth?: number;
  declare manner?: string;
  declare pregnancyContributed?: string;
  declare recentSurgery?: string;
  declare stillborn?: string;
  declare wasPregnant?: string;
  declare withinDayOfBirth?: boolean;
  declare outsideHealthFacility?: boolean;
  declare primaryCauseTimeAfterOnset?: number;
  declare antecedentCause1TimeAfterOnset?: number;
  declare antecedentCause2TimeAfterOnset?: number;
  declare antecedentCause3TimeAfterOnset?: number;
  declare isFinal?: boolean;
  declare visibilityStatus: string;
  declare patientId?: string;
  declare clinicianId?: string;
  declare facilityId?: string;
  declare primaryCauseConditionId?: string;
  declare antecedentCause1ConditionId?: string;
  declare antecedentCause2ConditionId?: string;
  declare antecedentCause3ConditionId?: string;
  declare lastSurgeryReasonId?: string;
  declare carrierExistingConditionId?: string;

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

  static async buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
