import Sequelize, { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '../errors';
import { dateTimeType } from './dateTimeTypes';

import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from './buildPatientSyncFilterViaPatientId';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';

export class PatientBirthData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: {
          // patient birth data records use a patient_id as the primary key, acting as a
          // db-level enforcement of one per patient, and simplifying sync
          type: `TEXT GENERATED ALWAYS AS ("patient_id")`,
          set() {
            // any sets of the convenience generated "id" field can be ignored, so do nothing here
          },
        },
        patientId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'patients',
            key: 'id',
          },
        },
        birthWeight: { type: Sequelize.DECIMAL },
        birthLength: { type: Sequelize.DECIMAL },
        birthDeliveryType: { type: Sequelize.STRING },
        attendantAtBirth: { type: Sequelize.STRING },
        nameOfAttendantAtBirth: { type: Sequelize.STRING },
        gestationalAgeEstimate: { type: Sequelize.FLOAT },
        apgarScoreOneMinute: { type: Sequelize.INTEGER },
        apgarScoreFiveMinutes: { type: Sequelize.INTEGER },
        apgarScoreTenMinutes: { type: Sequelize.INTEGER },
        timeOfBirth: dateTimeType('timeOfBirth'),
        birthType: { type: Sequelize.STRING }, // Single/Plural
        registeredBirthPlace: { type: Sequelize.STRING },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
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
    onSaveMarkPatientForSync(this);
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
    'registeredBirthPlace',
  ];

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
