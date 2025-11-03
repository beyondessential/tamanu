import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
<<<<<<<< HEAD:packages/database/src/models/Invoice/InvoiceInsurer.ts
import { Model } from '../Model';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import type { InitOptions, Models } from '../../types/model';
========
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
>>>>>>>> 43b838840f (add invoice insurance contracts):packages/database/src/models/InvoicesInvoiceInsuranceContract.ts
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../../sync/buildEncounterLinkedLookupFilter';

export class InvoicesInvoiceInsuranceContract extends Model {
  declare id: string;
  declare invoiceId: string;
  declare invoiceInsuranceContractId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        invoiceId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        invoiceInsuranceContractId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [
          { fields: ['invoiceId'] },
          { fields: ['invoiceInsuranceContractId'] },
          { unique: true, fields: ['invoiceId', 'invoiceInsuranceContractId'] },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });

    this.belongsTo(models.InvoiceInsuranceContract, {
      foreignKey: 'invoiceInsuranceContractId',
      as: 'invoiceInsuranceContract',
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
