import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { InitOptions, Models } from '../types/model';

const AI_DOCUMENT_SUMMARY_TYPES = ['patient', 'discharge'] as const;
const AI_DOCUMENT_RECORD_TYPES = ['Patient', 'Discharge'] as const;
const AI_DOCUMENT_STATUSES = ['generated', 'edited', 'discarded'] as const;
const AI_DOCUMENT_SOURCES = ['ai', 'human'] as const;

export class AiDocument extends Model {
  declare id: string;
  declare summaryType: string;
  declare recordType: string;
  declare recordId: string;
  declare status: string;
  declare content: string | null;
  declare source: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        summaryType: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isIn: [AI_DOCUMENT_SUMMARY_TYPES as unknown as string[]],
          },
        },
        recordType: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isIn: [AI_DOCUMENT_RECORD_TYPES as unknown as string[]],
          },
        },
        recordId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'generated',
          validate: {
            isIn: [AI_DOCUMENT_STATUSES as unknown as string[]],
          },
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        source: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'ai',
          validate: {
            isIn: [AI_DOCUMENT_SOURCES as unknown as string[]],
          },
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(_models: Models) {
    // no relations yet
  }

  static buildPatientSyncFilter(
    patientCount: number,
    markedForSyncPatientsTable: string,
  ) {
    if (patientCount === 0) {
      return null;
    }
    return `
      LEFT JOIN discharges ON ai_documents.record_id = discharges.id AND ai_documents.record_type = 'Discharge'
      LEFT JOIN encounters ON discharges.encounter_id = encounters.id
      WHERE (
        (ai_documents.record_type = 'Patient' AND ai_documents.record_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}))
        OR (ai_documents.record_type = 'Discharge' AND encounters.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}))
      )
      AND ai_documents.updated_at_sync_tick > :since
    `;
  }

  static async buildSyncLookupQueryDetails() {
    const patientIdExpr = `
      CASE
        WHEN ai_documents.record_type = 'Patient' THEN ai_documents.record_id
        WHEN ai_documents.record_type = 'Discharge' THEN encounters.patient_id
      END
    `;
    return {
      select: await buildSyncLookupSelect(this, { patientId: patientIdExpr }),
      joins: `
        LEFT JOIN discharges ON ai_documents.record_id = discharges.id AND ai_documents.record_type = 'Discharge'
        LEFT JOIN encounters ON discharges.encounter_id = encounters.id
      `,
    };
  }
}
