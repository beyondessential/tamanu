import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model';
import type { InitOptions, Models } from '../../types/model';

export class InvoiceInsurancePlanItem extends Model {
  declare id: string;
  declare invoiceInsurancePlanId: string;
  declare invoiceProductId: string;
  declare coverageValue?: number;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        invoiceInsurancePlanId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        invoiceProductId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        coverageValue: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [
          { fields: ['invoiceInsurancePlanId'] },
          { unique: true, fields: ['invoiceProductId', 'invoiceInsurancePlanId'] },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.InvoiceInsurancePlan, {
      foreignKey: 'invoiceInsurancePlanId',
      as: 'invoiceInsurancePlan',
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
