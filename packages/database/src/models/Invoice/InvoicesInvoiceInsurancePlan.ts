import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model';
import type { InitOptions, Models } from '../../types/model';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../../sync/buildEncounterLinkedLookupFilter';

export class InvoicesInvoiceInsurancePlan extends Model {
  declare id: string;
  declare invoiceId: string;
  declare invoiceInsurancePlanId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        invoiceId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        invoiceInsurancePlanId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [
          { fields: ['invoiceId'] },
          { fields: ['invoiceInsurancePlanId'] },
          { unique: true, fields: ['invoiceId', 'invoiceInsurancePlanId'] },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });

    this.belongsTo(models.InvoiceInsurancePlan, {
      foreignKey: 'invoiceInsurancePlanId',
      as: 'invoiceInsurancePlan',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'invoices', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedLookupJoins(this, ['invoices', 'encounters']),
    };
  }
}
