import { DataTypes } from 'sequelize';
import { DOCUMENT_SOURCES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilterJoins } from '../sync/buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class DocumentMetadata extends Model {
  id!: string;
  name!: string;
  type!: string;
  source!: string;
  documentCreatedAt?: string;
  documentUploadedAt!: string;
  documentOwner?: string;
  note?: string;
  attachmentId!: string;
  encounterId?: string;
  patientId?: string;
  departmentId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        type: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        source: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: DOCUMENT_SOURCES.UPLOADED,
        },
        documentCreatedAt: dateTimeType('documentCreatedAt'),
        documentUploadedAt: dateTimeType('documentUploadedAt', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        documentOwner: DataTypes.TEXT,
        note: DataTypes.STRING,

        // Relation can't be managed by sequelize because the
        // attachment won't get downloaded to facility server
        attachmentId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
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

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
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
