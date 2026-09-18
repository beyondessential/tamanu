import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';
import type { InitOptions, Models } from '../types/model';

export class EncounterSyndromeItem extends Model {
  declare id: string;
  declare encounterSyndromeId?: string;
  declare syndromeId?: string;
  declare checked: boolean;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        checked: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.EncounterSyndrome, {
      foreignKey: 'encounterSyndromeId',
      as: 'encounterSyndrome',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'syndromeId',
      as: 'syndrome',
    });
  }

  static getListReferenceAssociations() {
    return ['syndrome'];
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounter_syndromes', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedLookupJoins(this, ['encounter_syndromes', 'encounters']),
    };
  }
}
