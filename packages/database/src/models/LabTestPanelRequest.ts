import { type ModelStatic } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '@tamanu/shared/models/buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from '@tamanu/shared/sync/buildSyncLookupSelect';
import { type ModelAttributes, type SessionConfig } from '../types/sequelize';

export class LabTestPanelRequest extends Model {
  static init({ primaryKey, sequelize, ...options }: ModelAttributes) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
        primaryKey,
        sequelize,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(this: ModelStatic<LabTestPanelRequest>, models: { [key: string]: ModelStatic<any> }) {
    this.belongsTo(models.Encounter!, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.LabTestPanel!, {
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
