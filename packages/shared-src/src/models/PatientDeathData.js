import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class PatientDeathData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        manner: {
          type: Sequelize.STRING,
          allowNull: false,
        },

        recentSurgery: Sequelize.STRING, // yes/no/unknown/null
        lastSurgeryDate: Sequelize.DATE,

        externalCauseDate: Sequelize.DATE,
        externalCauseLocation: Sequelize.STRING,
        externalCauseNotes: Sequelize.TEXT,

        wasPregnant: Sequelize.STRING, // yes/no/unknown/null
        pregnancyContributed: Sequelize.STRING, // yes/no/unknown/null

        fetalOrInfant: Sequelize.BOOLEAN, // true/false/null
        stillborn: Sequelize.STRING, // yes/no/unknown/null
        birthWeight: {
          type: Sequelize.INTEGER,
          unsigned: true,
        },
        withinDayOfBirth: Sequelize.BOOLEAN,
        hoursSurvivedSinceBirth: {
          type: Sequelize.INTEGER,
          unsigned: true,
        },
        carrierAge: {
          type: Sequelize.INTEGER,
          unsigned: true,
        },
        carrierPregnancyWeeks: {
          type: Sequelize.INTEGER,
          unsigned: true,
        },
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
          mustHavePrimaryCause() {
            if (this.deletedAt) return;
            if (!this.primaryCauseId) {
              throw new InvalidOperationError(
                'Patient death data must have a primary cause of death.',
              );
            }
          },
          ynuFields() {
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
    });

    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
    });

    // conceptually "hasOne" but we want the foreign key to be here
    this.belongsTo(models.DeathCause, {
      foreignKey: 'primaryCauseId',
      as: 'primaryCause',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'lastSurgeryReasonId',
      as: 'lastSurgeryReason',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'carrierExistingConditionId',
      as: 'carrierExistingCondition',
    });
  }
}
