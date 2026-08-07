import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilterJoins } from '../sync/buildEncounterLinkedSyncFilter';
import type { InitOptions, Models } from '../types/model';
import type { ModelSanitizeArgs } from '../types/sync';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

export class Attachment extends Model {
  declare id: string;
  declare type?: String;
  declare size?: Number;
  declare hash?: string;
  declare data?: Buffer;
  declare patientId?: string;
  declare encounterId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        type: DataTypes.TEXT,
        size: DataTypes.INTEGER,
        hash: DataTypes.TEXT,
        data: DataTypes.BLOB,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
  }

  static sanitizeForDatabase({
    data,
    ...restOfValues
  }: ModelSanitizeArgs<{ data: string; type?: string; size?: number }>) {
    return { ...restOfValues, data: Buffer.from(data, 'base64') };
  }

  // Mobile still uploads by carrying its bytes in the synchronised record; those
  // arrive base64-encoded and are stored as a legacy in-database attachment.
  static sanitizeForCentralServer(
    values: ModelSanitizeArgs<{ data?: string; type?: string; size?: number }>,
  ) {
    if (typeof values.data !== 'string') {
      return values;
    }
    return this.sanitizeForDatabase(values as ModelSanitizeArgs<{ data: string }>);
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
      AND ${this.tableName}.hash IS NOT NULL
      AND ${this.tableName}.updated_at_sync_tick > :since
    `;
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this, {
        patientId: 'COALESCE(attachments.patient_id, encounters.patient_id)',
      }),
      // A legacy attachment keeps its bytes in the row and stays on the central
      // server, so only hash-carrying attachments enter the lookup. The filter is
      // a join rather than a where clause because a full lookup rebuild replaces
      // the where clause with its own.
      joins: `
        ${buildEncounterLinkedLookupJoins(this)}
        JOIN attachments hash_backed
          ON hash_backed.id = attachments.id AND hash_backed.hash IS NOT NULL
      `,
    };
  }
}
