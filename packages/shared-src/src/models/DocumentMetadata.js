import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { initSyncForModelNestedUnderPatient } from './sync';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';

export class DocumentMetadata extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        type: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        documentCreatedAt: dateTimeType('documentCreatedAt'),
        documentUploadedAt: dateTimeType('documentUploadedAt', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        documentOwner: Sequelize.TEXT,
        note: Sequelize.STRING,

        // Relation can't be managed by sequelize because the
        // attachment won't get downloaded to lan server
        attachmentId: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        ...options,
        /* 
          DocumentMetadata must be associated to a patient or an encounter, but never both.
          Because of this, it can't have default channels or otherwise it might
          create foreign key errors with encounters (since it's possible that
          the associated encounter doesn't exist in a particular lan server).
          This gets resolved by including the model inside Encounter includedRelations
          and nesting it under Patient to cover the ones related to patients.
        */
        syncConfig: initSyncForModelNestedUnderPatient(this, 'documentMetadata'),
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department',
    });
  }
}
