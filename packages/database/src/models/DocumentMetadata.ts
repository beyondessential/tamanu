import { DataTypes } from 'sequelize';
import { DOCUMENT_SOURCES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilterJoins } from '../sync/buildEncounterLinkedSyncFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

export class DocumentMetadata extends Model {
  declare id: string;
  declare name: string;
  declare type: string;
  declare source: string;
  declare documentCreatedAt?: string;
  declare documentUploadedAt: string;
  declare documentOwner?: string;
  declare note?: string;
  declare attachmentId: string;
  declare encounterId?: string;
  declare patientId?: string;
  declare departmentId?: string;

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

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this, {
        patientId: 'COALESCE(document_metadata.patient_id, encounters.patient_id)',
      }),
      joins: buildEncounterLinkedLookupJoins(this),
    };
  }
}
