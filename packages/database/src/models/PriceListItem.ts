import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class PriceListItem extends Model {
  declare id: string;
  declare priceListId: string;
  declare code: string;
  declare name: string;
  declare price: number;
  declare discountable: boolean;
  declare visibilityStatus: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        priceListId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        code: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        price: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [{ fields: ['priceListId'] }, { unique: true, fields: ['priceListId', 'code'] }],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.PriceList, {
      foreignKey: 'priceListId',
      as: 'priceList',
    });
    // Link PriceListItem to InvoiceProduct via `code` matching `InvoiceProduct.id`.
    // Using constraints: false to avoid FK migration; this is a logical association.
    this.belongsTo(models.InvoiceProduct, {
      foreignKey: 'code',
      as: 'product',
      constraints: false,
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
