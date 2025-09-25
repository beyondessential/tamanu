import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync/buildEncounterLinkedSyncFilter';
import type { InitOptions, Models } from '../types/model';
import { buildEncounterLinkedLookupSelect } from '../sync/buildEncounterLinkedLookupFilter';

export class TaskDesignation extends Model {
  declare id: string;
  declare taskId?: string;
  declare designationId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Task, {
      foreignKey: 'taskId',
      as: 'task',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'designationId',
      as: 'designation',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'tasks', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'tasks', 'encounters']),
    };
  }
}
