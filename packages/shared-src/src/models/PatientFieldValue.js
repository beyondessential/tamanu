import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { initSyncForModelNestedUnderPatient } from './sync';

export class PatientFieldValue extends Model {
  static init({ primaryKey, ...options }) {
    // TODO: update when new sync lands
    const nestedSyncConfig = initSyncForModelNestedUnderPatient(this, 'fieldDefinition');
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
        syncConfig: nestedSyncConfig,
      },
    );
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
}
