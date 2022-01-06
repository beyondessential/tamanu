import { Sequelize } from 'sequelize';
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
      },
      {
        ...options,
        tableName: 'patient_vrs_data',
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
