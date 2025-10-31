import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class InvoiceInsuranceContractItem extends Model {
  declare id: string;
  declare invoiceInsuranceContractId: string;
  declare invoiceProductId: string;
  declare coverageValue?: number;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        invoiceInsuranceContractId: {
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
          { fields: ['invoiceInsuranceContractId'] },
          { unique: true, fields: ['invoiceProductId', 'invoiceInsuranceContractId'] },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.InvoiceInsuranceContract, {
      foreignKey: 'invoiceInsuranceContractId',
      as: 'invoiceInsuranceContract',
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
