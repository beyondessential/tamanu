import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

// Model to store VRS-related data that we don't currently have a good place for
export class PatientVRSData extends Model {
  declare id: string;
  declare idType?: string;
  declare identifier?: string;
  declare unmatchedVillageName?: string;
  declare isDeletedByRemote: boolean;
  declare patientId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        idType: DataTypes.STRING,
        identifier: DataTypes.STRING,
        // if we don't have a matching village, persist the unmatched name here
        unmatchedVillageName: DataTypes.STRING,
        isDeletedByRemote: {
          type: DataTypes.BOOLEAN,
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

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
  }
}
