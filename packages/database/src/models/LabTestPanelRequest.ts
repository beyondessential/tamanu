import { type CreationOptional } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync/buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { SessionConfig } from '../types/sync';
import type { InitOptions, Models } from '../types/model';

const getAttributes = (primaryKey: any) => ({
  id: primaryKey,
});

export class LabTestPanelRequest extends Model {
  id!: CreationOptional<string>;
  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(getAttributes(primaryKey),
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

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string, sessionConfig: SessionConfig) {
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

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'encounters.patient_id',
        isLabRequestValue: 'TRUE',
      }),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'encounters']),
    };
  }
}
