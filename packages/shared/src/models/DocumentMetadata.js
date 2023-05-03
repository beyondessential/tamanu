import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { buildEncounterLinkedSyncFilterJoins } from './buildEncounterLinkedSyncFilter';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';

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
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );

    onSaveMarkPatientForSync(this);
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

  static getListReferenceAssociations() {
    return ['department'];
  }

  static buildSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    const join = buildEncounterLinkedSyncFilterJoins([this.tableName, 'encounters']);
    return `
      ${join}
      WHERE (
        encounters.patient_id IN (:patientIds)
        OR
        ${this.tableName}.patient_id IN (:patientIds)
      )
      AND ${this.tableName}.updated_at_sync_tick > :since
    `;
  }
}
