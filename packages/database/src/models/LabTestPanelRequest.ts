import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { SessionConfig } from '../types/sync';
import type { InitOptions, Models } from '../types/model';
import type { LabTestPanel } from './LabTestPanel';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

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

  static getSyncFilterConditionExpression() {
    return `
      ${this.tableName}.updated_at_sync_tick > :since
      OR EXISTS (
        SELECT 1 FROM lab_requests lr
        WHERE lr.lab_test_panel_request_id = ${this.tableName}.id
        AND lr.updated_at_sync_tick > :since
      )
    `;
  }

  static buildPatientSyncFilter(
    patientCount: number,
    markedForSyncPatientsTable: string,
    sessionConfig: SessionConfig,
  ) {
    if (sessionConfig.syncAllLabRequests) {
      // Include when either the panel request itself changed or any linked lab_request changed
      return `
        WHERE (
          ${this.getSyncFilterConditionExpression()}
        )
      `;
    }
    if (patientCount === 0) {
      return null;
    }
    // Patient-scoped: via encounters and include when either the panel request or linked lab_request changed
    return `
      INNER JOIN encounters ON ${this.tableName}.encounter_id = encounters.id
      WHERE encounters.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
      AND (
        ${this.getSyncFilterConditionExpression()}
      )
    `;
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildEncounterLinkedLookupSelect(this, {
        isLabRequestValue: 'TRUE',
      }),
      joins: buildEncounterLinkedLookupJoins(this),
      where: this.getSyncFilterConditionExpression(),
    };
  }
}
