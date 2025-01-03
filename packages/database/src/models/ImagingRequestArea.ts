import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterPatientIdSelect } from '../sync/buildPatientLinkedLookupFilter';
import type { InitOptions, Models } from '../types/model';

export class ImagingRequestArea extends Model {
  declare id: string;
  declare imagingRequestId?: string;
  declare areaId?: string;

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
    this.belongsTo(models.ImagingRequest, {
      foreignKey: 'imagingRequestId',
      as: 'imagingRequest',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'areaId',
      as: 'area',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'imaging_requests', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildEncounterPatientIdSelect(this),
      joins: buildEncounterLinkedSyncFilterJoins([
        this.tableName,
        'imaging_requests',
        'encounters',
      ]),
    };
  }
}
