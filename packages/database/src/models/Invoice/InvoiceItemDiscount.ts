import { DataTypes } from 'sequelize';
import { INVOICE_ITEMS_DISCOUNT_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import { Model } from '../Model';
import type { InitOptions, Models } from '../../types/model';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../../sync/buildEncounterLinkedLookupFilter';

const INVOICE_ITEMS_DISCOUNT_TYPE_VALUES = Object.values(INVOICE_ITEMS_DISCOUNT_TYPES);

export class InvoiceItemDiscount extends Model {
  declare id: string;
  declare amount: number;
  declare type: (typeof INVOICE_ITEMS_DISCOUNT_TYPE_VALUES)[number];
  declare reason?: string;
  declare invoiceItemId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        amount: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM(...INVOICE_ITEMS_DISCOUNT_TYPE_VALUES),
          allowNull: false,
          defaultValue: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
        },
        reason: DataTypes.STRING,
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.InvoiceItem, {
      foreignKey: 'invoiceItemId',
      as: 'invoiceItem',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'invoice_items', 'invoices', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedLookupJoins(this, ['invoice_items', 'invoices', 'encounters']),
    };
  }
}
