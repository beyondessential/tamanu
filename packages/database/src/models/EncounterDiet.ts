import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model.ts';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter.ts';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter.ts';
import type { InitOptions, Models } from '../types/model.ts';

export class EncounterDiet extends Model {
  declare id: string;
  declare encounterId?: string;
  declare dietId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
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
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'dietId',
      as: 'diet',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }
}
