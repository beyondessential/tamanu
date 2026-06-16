import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model.ts';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter.ts';
import type { InitOptions, Models } from '../../types/model.ts';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../../sync/buildEncounterLinkedLookupFilter.ts';
import { afterCreateHook, afterUpdateHook } from './hooks.ts';
import type { ReferenceData } from 'models/ReferenceData';

export class ImagingRequestArea extends Model {
  declare id: string;
  declare imagingRequestId?: string;
  declare areaId?: string;

  declare area?: ReferenceData;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: {
          afterCreate: afterCreateHook,
          afterUpdate: afterUpdateHook,
        },
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
    this.hasOne(models.InvoiceItem, {
      foreignKey: 'sourceRecordId',
      as: 'invoiceItem',
      constraints: false,
      scope: { source_record_type: this.name },
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

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedLookupJoins(this, ['imaging_requests', 'encounters']),
    };
  }
}
