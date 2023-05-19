import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { dateType } from './dateTimeTypes';
import { Model } from './Model';
import { buildPatientLinkedSyncFilter } from './buildPatientLinkedSyncFilter';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';

export class PatientDeathData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        birthWeight: { type: Sequelize.INTEGER, unsigned: true },
        carrierAge: { type: Sequelize.INTEGER, unsigned: true },
        carrierPregnancyWeeks: { type: Sequelize.INTEGER, unsigned: true },
        externalCauseDate: dateType('externalCauseDate'),
        lastSurgeryDate: dateType('lastSurgeryDate'),
        externalCauseLocation: Sequelize.STRING,
        externalCauseNotes: Sequelize.TEXT,
        fetalOrInfant: Sequelize.BOOLEAN, // true/false/null
        hoursSurvivedSinceBirth: { type: Sequelize.INTEGER, unsigned: true },
        manner: Sequelize.STRING,
        pregnancyContributed: Sequelize.STRING, // yes/no/unknown/null
        recentSurgery: Sequelize.STRING, // yes/no/unknown/null
        stillborn: Sequelize.STRING, // yes/no/unknown/null
        wasPregnant: Sequelize.STRING, // yes/no/unknown/null
        withinDayOfBirth: Sequelize.BOOLEAN,
        outsideHealthFacility: Sequelize.BOOLEAN,
        primaryCauseTimeAfterOnset: Sequelize.INTEGER, // minutes
        antecedentCause1TimeAfterOnset: Sequelize.INTEGER, // minutes
        antecedentCause2TimeAfterOnset: Sequelize.INTEGER, // minutes
        isFinal: Sequelize.BOOLEAN,
        visibilityStatus: { type: Sequelize.TEXT, defaultValue: VISIBILITY_STATUSES.CURRENT },
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
              if (this[field] && !['yes', 'no', 'unknown'].includes(this[field])) {
                throw new InvalidOperationError(`${field} must be 'yes', 'no', 'unknown', or null`);
              }
            }
          },
        },
      },
    );
    onSaveMarkPatientForSync(this);
  }

  static initRelations(models) {
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
      allowNull: true,
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'antecedentCause2ConditionId',
      as: 'antecedentCause2Condition',
      allowNull: true,
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

  static buildSyncFilter = buildPatientLinkedSyncFilter;
}
