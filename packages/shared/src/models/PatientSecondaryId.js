import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from './buildPatientSyncFilterViaPatientId';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';
import { buildPatientLinkedLookupFilter } from './buildPatientLinkedLookupFilter';

export class PatientSecondaryId extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        value: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        visibilityStatus: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
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
      foreignKey: 'typeId',
      as: 'type',
    });
  }

  static buildSyncLookupFilter() {
    return buildPatientLinkedLookupFilter(this.tableName);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
