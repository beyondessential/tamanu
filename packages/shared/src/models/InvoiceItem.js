import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';

export class InvoiceItem extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        orderDate: DataTypes.DATESTRING,
        productId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        productName: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        productPrice: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  /**
   *
   * @param {import('./')} models
   */
  static initRelations(models) {
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });

    this.hasOne(models.InvoiceItemDiscount, {
      foreignKey: 'invoiceItemId',
      as: 'discount',
    });

    this.belongsTo(models.User, {
      foreignKey: 'orderedByUserId',
      as: 'orderedByUser',
    });

    this.belongsTo(models.InvoiceProduct, {
      foreignKey: 'productId',
      as: 'product',
    });
  }

  static buildPatientSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'invoices', 'encounters']);
  }
}
