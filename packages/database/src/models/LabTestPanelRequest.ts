import {
  INVOICE_ITEMS_CATEGORIES,
  SYNC_DIRECTIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { shouldAddLabRequestToInvoice } from './LabRequest/hooks';
import type { SessionConfig } from '../types/sync';
import type { InitOptions, Models } from '../types/model';
import type { LabTestPanel } from './LabTestPanel';
import type { LabRequest } from './LabRequest';
import type { LabTest } from './LabTest';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

// A panel that has an invoice product bills that product once for its panel request. Panel requests
// are created after their lab request, so this fires here rather than from the lab request hook.
const addPanelToInvoiceAfterCreateHook = async (instance: LabTestPanelRequest) => {
  const { LabRequest: LabRequestModel, InvoiceProduct, Invoice } = instance.sequelize.models;
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

  const panelProduct = await InvoiceProduct.findOne({
    where: {
      category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL,
      sourceRecordId: instance.labTestPanelId,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  });
  if (!panelProduct) {
    return;
  }

  await Invoice.addItemToInvoice(
    instance,
    labRequest.encounterId,
    panelProduct,
    labRequest.requestedById,
  );
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
