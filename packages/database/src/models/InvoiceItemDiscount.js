import { DataTypes } from 'sequelize';
import { INVOICE_ITEMS_DISCOUNT_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

export class InvoiceItemDiscount extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        amount: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM(Object.values(INVOICE_ITEMS_DISCOUNT_TYPES)),
          allowNull: false,
          defaultValue: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
        },
        reason: DataTypes.STRING,
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  /**
   *
   * @param {import('./')} models
   */
  static initRelations(models) {
    this.belongsTo(models.InvoiceItem, {
      foreignKey: 'invoiceItemId',
      as: 'invoiceItem',
    });
  }

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'invoice_items', 'invoices', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'encounters.patient_id',
      }),
      joins: buildEncounterLinkedSyncFilterJoins([
        this.tableName,
        'invoice_items',
        'invoices',
        'encounters',
      ]),
    };
  }
}
