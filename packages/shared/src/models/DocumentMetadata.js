import { Sequelize } from 'sequelize';
import { DOCUMENT_SOURCES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { buildEncounterLinkedSyncFilterJoins } from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

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
        source: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: DOCUMENT_SOURCES.UPLOADED,
        },
        documentCreatedAt: dateTimeType('documentCreatedAt'),
        documentUploadedAt: dateTimeType('documentUploadedAt', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        documentOwner: Sequelize.TEXT,
        note: Sequelize.STRING,

        // Relation can't be managed by sequelize because the
        // attachment won't get downloaded to facility server
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

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    const join = buildEncounterLinkedSyncFilterJoins([this.tableName, 'encounters']);
    return `
      ${join}
      WHERE (
        encounters.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
        OR
        ${this.tableName}.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
      )
      AND ${this.tableName}.updated_at_sync_tick > :since
    `;
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'COALESCE(document_metadata.patient_id, encounters.patient_id)',
      }),
      joins: `
        LEFT JOIN encounters ON ${this.tableName}.encounter_id = encounters.id
        LEFT JOIN patients ON ${this.tableName}.patient_id = encounters.id
      `,
    };
  }
}
