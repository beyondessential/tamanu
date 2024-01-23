import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from './buildPatientSyncFilterViaPatientId';

export class PatientContact extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: Sequelize.TEXT,
        method: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        address: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        deletionStatus: Sequelize.TEXT,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'relationshipId',
      as: 'relationship',
    });
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
