import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';
import { buildPatientLinkedSyncFilter } from './buildPatientLinkedSyncFilter';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';

export class PatientFieldValue extends Model {
  static init({ primaryKey, ...options }) {
    // TODO: update when new sync lands
    super.init(
      {
        id: primaryKey,
        // values are saved as strings, types are used for validation and UI
        value: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [
          // these are used for querying values, to avoid a sequential scan
          {
            name: 'patient_field_values_patient_id',
            fields: ['patient_id'],
          },
          {
            name: 'patient_field_values_definition_id',
            fields: ['definition_id'],
          },
          {
            name: 'patient_field_values_updated_at',
            fields: ['updated_at'],
          },
        ],
      },
    );
    onSaveMarkPatientForSync(this);
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.PatientFieldDefinition, {
      foreignKey: 'definitionId',
      as: 'definition',
    });
  }

  static buildSyncFilter = buildPatientLinkedSyncFilter;
}
