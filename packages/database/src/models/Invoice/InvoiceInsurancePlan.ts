import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from '../Model';
import type { InitOptions, Models } from '../../types/model';

export class InvoiceInsurancePlan extends Model {
  declare id: string;
  declare code: string;
  declare name?: string;
  declare defaultCoverage?: number;
  declare visibilityStatus: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        defaultCoverage: {
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
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static initRelations(models: Models) {
    this.hasMany(models.InvoiceInsurancePlanItem, {
      foreignKey: 'invoiceInsurancePlanId',
      as: 'invoiceInsurancePlanItems',
    });

    this.hasMany(models.InvoicesInvoiceInsurancePlan, {
      foreignKey: 'invoiceInsurancePlanId',
      as: 'invoices',
    });

    this.belongsToMany(models.Invoice, {
      through: models.InvoicesInvoiceInsurancePlan,
      foreignKey: 'invoiceInsurancePlanId',
      otherKey: 'invoiceId',
      as: 'relatedInvoices',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
