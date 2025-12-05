import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from '../Model';
import type { InitOptions, Models } from '../../types/model';

export class InvoicePriceListItem extends Model {
  declare id: string;
  declare invoicePriceListId: string;
  declare invoiceProductId: string;
  declare price: number | null;
  declare visibilityStatus: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        invoicePriceListId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        invoiceProductId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        price: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [
          { fields: ['invoicePriceListId'] },
          { unique: true, fields: ['invoicePriceListId', 'invoiceProductId'] },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.InvoicePriceList, {
      foreignKey: 'invoicePriceListId',
      as: 'invoicePriceList',
    });

    this.belongsTo(models.InvoiceProduct, {
      foreignKey: 'invoiceProductId',
      as: 'product',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
