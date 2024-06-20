import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';

export class InvoiceItemDiscount extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        percentage: {
          type: DataTypes.DECIMAL,
          allowNull: false,
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

  static buildPatientSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([
      this.tableName,
      'invoice_items',
      'invoices',
      'encounters',
    ]);
  }
}
