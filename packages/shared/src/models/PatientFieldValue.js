import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
import { Model } from './Model';
import { buildPatientLinkedSyncFilter } from './buildPatientLinkedSyncFilter';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';

export class PatientFieldValue extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: {
          // patient field value records use a generated primary key that enforces one per patient,
          // even across a distributed sync system
          type: `TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("definition_id", ';', ':')) STORED`,
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
        definitionId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'patient_field_definitions',
            key: 'id',
          },
        },
        // values are saved as strings, types are used for validation and UI
        value: {
          type: DataTypes.STRING,
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
