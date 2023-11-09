import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';

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

  static buildPatientSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'imaging_requests', 'encounters']);
  }
}
