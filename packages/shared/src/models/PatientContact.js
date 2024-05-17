import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from './buildPatientSyncFilterViaPatientId';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';

export class PatientContact extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        method: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        connectionDetails: Sequelize.JSONB,
        deletionStatus: Sequelize.TEXT,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
    onSaveMarkPatientForSync(this);
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'relationshipId',
      as: 'relationship',
    });
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;

  static getListReferenceAssociations() {
    return ['relationship'];
  }
}
