import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class PatientDeathData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        birthWeight: { type: Sequelize.INTEGER, unsigned: true },
        carrierAge: { type: Sequelize.INTEGER, unsigned: true },
        carrierPregnancyWeeks: { type: Sequelize.INTEGER, unsigned: true },
        externalCauseDate: Sequelize.DATE,
        externalCauseLocation: Sequelize.STRING,
        externalCauseNotes: Sequelize.TEXT,
        fetalOrInfant: Sequelize.BOOLEAN, // true/false/null
        hoursSurvivedSinceBirth: { type: Sequelize.INTEGER, unsigned: true },
        lastSurgeryDate: Sequelize.DATE,
        manner: { type: Sequelize.STRING, allowNull: false },
        pregnancyContributed: Sequelize.STRING, // yes/no/unknown/null
        recentSurgery: Sequelize.STRING, // yes/no/unknown/null
        stillborn: Sequelize.STRING, // yes/no/unknown/null
        wasPregnant: Sequelize.STRING, // yes/no/unknown/null
        withinDayOfBirth: Sequelize.BOOLEAN,
        outsideHealthFacility: Sequelize.BOOLEAN,
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
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
    this.belongsTo(models.DeathCause, {
      foreignKey: 'primaryCauseId',
      as: 'primaryCause',
      constraints: false,
    });
    this.belongsTo(models.DeathCause, {
      foreignKey: 'antecedentCause1Id',
      as: 'antecedentCause1',
      constraints: false,
    });
    this.belongsTo(models.DeathCause, {
      foreignKey: 'antecedentCause2Id',
      as: 'antecedentCause2',
      constraints: false,
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'lastSurgeryReasonId',
      as: 'lastSurgeryReason',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'carrierExistingConditionId',
      as: 'carrierExistingCondition',
    });

    // for "contributing" death causes but also includes the primary/secondary
    this.hasMany(models.DeathCause, {
      foreignKey: 'patientDeathDataId',
      as: 'contributingCauses',
      constraints: false,
    });
  }
}
