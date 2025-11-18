import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model';
import type { InitOptions, Models } from '../../types/model';

export class InvoiceItemFinalisedInsurance extends Model {
  declare id: string;
  declare invoiceItemId: string;
  declare coverageValueFinal: string;
  declare invoiceInsurancePlanId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        invoiceItemId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        coverageValueFinal: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        invoiceInsurancePlanId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [
          { fields: ['invoiceItemId'] },
          { fields: ['invoiceInsurancePlanId'] },
          { unique: true, fields: ['invoiceItemId', 'invoiceInsurancePlanId'] },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.InvoiceItem, {
      foreignKey: 'invoiceItemId',
      as: 'invoiceItem',
    });

    this.belongsTo(models.InvoiceInsurancePlan, {
      foreignKey: 'invoiceInsurancePlanId',
      as: 'invoiceInsurancePlan',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
