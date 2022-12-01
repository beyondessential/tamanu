import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class PatientFacility extends Model {
  static init(options) {
    super.init(
      {
        id: {
          type: `TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("facility_id", ';', ':')) STORED`,
          set() {
            // patient facility records use a composite primary key
            // any sets of the convenience generated "id" field can be ignored
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

  static buildSyncFilter() {
    return `WHERE facility_id = :facilityId AND ${this.tableName}.updated_at_sync_tick > :since`;
  }
}
