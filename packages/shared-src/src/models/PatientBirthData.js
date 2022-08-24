import Sequelize from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';

import { Model } from './Model';

export class PatientBirthData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        birthWeight: { type: Sequelize.DECIMAL },
        birthLength: { type: Sequelize.DECIMAL },
        birthDeliveryType: { type: Sequelize.STRING },
        attendantAtBirth: { type: Sequelize.STRING },
        nameOfAttendantAtBirth: { type: Sequelize.STRING },
        gestationalAgeEstimate: { type: Sequelize.INTEGER },
        apgarScoreOneMinute: { type: Sequelize.INTEGER },
        apgarScoreFiveMinutes: { type: Sequelize.INTEGER },
        apgarScoreTenMinutes: { type: Sequelize.INTEGER },
        timeOfBirth: { type: Sequelize.STRING },
        birthType: { type: Sequelize.STRING }, // Single/Plural
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
        tableName: 'patient_birth_data',
        validate: {
          mustHavePatient() {
            if (this.deletedAt) {
              return;
            }
            if (!this.patientId) {
              throw new InvalidOperationError('Patient birth data must have a patient.');
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

    this.belongsTo(models.Facility, {
      foreignKey: 'birthFacilityId',
      as: 'facility',
    });
  }

  static nonMetadataColumns = [
    'patientId',
    'birthWeight',
    'birthLength',
    'birthDeliveryType',
    'gestationalAgeEstimate',
    'apgarScoreOneMinute',
    'apgarScoreFiveMinutes',
    'apgarScoreTenMinutes',
    'timeOfBirth',
    'birthType',
    'attendantAtBirth',
    'nameOfAttendantAtBirth',
    'birthFacilityId',
  ];
}
