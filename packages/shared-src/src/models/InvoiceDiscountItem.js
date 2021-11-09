import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class InvoiceDiscountItem extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        description: Sequelize.STRING,
        discount: Sequelize.STRING,
        date: Sequelize.DATE,
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });

    this.belongsTo(models.InvoiceDiscountType, {
      foreignKey: 'invoiceDiscountTypeId',
      as: 'invoiceDiscountType',
    });

    this.belongsTo(models.User, {
      foreignKey: 'orderedById',
      as: 'orderedBy',
    });
  }
}
