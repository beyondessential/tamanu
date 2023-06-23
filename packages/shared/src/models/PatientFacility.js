import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
import { Model } from './Model';

export class PatientFacility extends Model {
  static init(options) {
    super.init(
      {
        id: {
          // patient facility records use a generated primary key that enforces one per patient,
          // even across a distributed sync system
          type: `TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("facility_id", ';', ':')) STORED`,
          set() {
            // any sets of the convenience generated "id" field can be ignored
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
        facilityId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'facilities',
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
