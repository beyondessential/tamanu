import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class PatientFacility extends Model {
  static init(options) {
    super.init(
      {
        id: {
          type: `TEXT GENERATED ALWAYS AS ("patient_id" || '-' || "facility_id") STORED`,
          set() {
            throw new Error(
              'Patient facility records use a composite primary key - the convenience generated "id" field should not be set directly',
            );
          },
        },
        facility_id: {
          type: DataTypes.STRING,
          primaryKey: true, // composite primary key
          references: {
            model: 'facilities',
            key: 'id',
          },
        },
        patient_id: {
          type: DataTypes.STRING,
          primaryKey: true, // composite primary key
          references: {
            model: 'patients',
            key: 'id',
          },
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
  }
}
