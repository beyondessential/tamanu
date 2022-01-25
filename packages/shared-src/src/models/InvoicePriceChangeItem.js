import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class InvoicePriceChangeItem extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        description: Sequelize.STRING,
        percentageChange: Sequelize.STRING,
        date: Sequelize.DATE,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });

    this.belongsTo(models.InvoicePriceChangeType, {
      foreignKey: 'invoicePriceChangeTypeId',
      as: 'invoicePriceChangeType',
    });

    this.belongsTo(models.User, {
      foreignKey: 'orderedById',
      as: 'orderedBy',
    });
  }
}
