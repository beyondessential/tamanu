import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model.ts';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter.ts';
import type { SessionConfig } from '../types/sync.ts';
import type { InitOptions, Models } from '../types/model.ts';
import type { LabTestPanel } from './LabTestPanel.ts';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter.ts';

export class LabTestPanelRequest extends Model {
  declare id: string;
  declare encounterId?: string;
  declare labTestPanelId?: string;
  declare labTestPanel?: LabTestPanel;

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
    this.belongsTo(models.LabTestPanel, {
      foreignKey: 'labTestPanelId',
      as: 'labTestPanel',
    });
  }

  static buildPatientSyncFilter(
    patientCount: number,
    markedForSyncPatientsTable: string,
    sessionConfig: SessionConfig,
  ) {
    if (sessionConfig.syncAllLabRequests) {
      return ''; // include all lab panel requests
    }
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this, {
        isLabRequestValue: 'TRUE',
      }),
      joins: buildEncounterLinkedLookupJoins(this),
    };
  }
}
