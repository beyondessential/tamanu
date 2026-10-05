import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { addLabRequestToInvoice, shouldAddLabRequestToInvoice } from './LabRequest/hooks';
import type { SessionConfig } from '../types/sync';
import type { InitOptions, Models } from '../types/model';
import type { LabTestPanel } from './LabTestPanel';
import type { LabRequest } from './LabRequest';
import type { LabTest } from './LabTest';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

// A panel request is created after its lab request, so the request's create hook cannot see it yet;
// re-resolve the whole request through the shared resolver here so a panel product is billed once.
const addPanelToInvoiceAfterCreateHook = async (instance: LabTestPanelRequest) => {
  const { LabRequest: LabRequestModel } = instance.sequelize.models;
  if (!instance.labRequestId) {
    return;
  }
  const labRequest = await LabRequestModel.findByPk(instance.labRequestId);
  if (!labRequest || !labRequest.encounterId) {
    return;
  }
  if (!(await shouldAddLabRequestToInvoice(labRequest))) {
    return;
  }
  await addLabRequestToInvoice(labRequest);
};

export class LabTestPanelRequest extends Model {
  declare id: string;
  declare encounterId?: string;
  declare labTestPanelId?: string;
  declare labRequestId?: string;
  declare labTestPanel?: LabTestPanel;
  declare labRequest?: LabRequest;
  declare tests?: LabTest[];

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: {
          afterCreate: addPanelToInvoiceAfterCreateHook,
        },
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
    this.belongsTo(models.LabRequest, {
      foreignKey: 'labRequestId',
      as: 'labRequest',
    });
    this.hasMany(models.LabTest, {
      foreignKey: 'labTestPanelRequestId',
      as: 'tests',
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
