import { SYNC_DIRECTIONS } from '../constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';

export class LabPanelRequest extends Model {
  static init({ primaryKey, ...options }) {
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

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.LabPanel, {
      foreignKey: 'labPanelId',
      as: 'labPanel',
    });
  }

  static buildSyncFilter(patientIds, sessionConfig) {
    if (sessionConfig.syncAllLabRequests) {
      return ''; // include all lab panel requests
    }
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'encounters']);
  }
}
