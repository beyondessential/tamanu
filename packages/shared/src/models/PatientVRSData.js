import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

// Model to store VRS-related data that we don't currently have a good place for
export class PatientVRSData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        idType: Sequelize.STRING,
        identifier: Sequelize.STRING,
        // if we don't have a matching village, persist the unmatched name here
        unmatchedVillageName: Sequelize.STRING,
        isDeletedByRemote: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
      },
      {
        ...options,
        tableName: 'patient_vrs_data',
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
  }
}
