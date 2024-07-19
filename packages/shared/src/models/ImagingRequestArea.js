import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from './buildEncounterLinkedSyncFilter';

export class ImagingRequestArea extends Model {
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
    this.belongsTo(models.ImagingRequest, {
      foreignKey: 'imagingRequestId',
      as: 'imagingRequest',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'areaId',
      as: 'area',
    });
  }

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'imaging_requests', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupFilter() {
    return {
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'imaging_requests', 'encounters']),
      patientIdTables: ['encounters'],
    };
  }
}
