import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class InvoiceLineItem extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        percentageChange: Sequelize.DECIMAL,
        date: Sequelize.DATE,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.InvoiceLineType, {
      foreignKey: 'invoiceLineTypeId',
      as: 'invoiceLineType',
    });

    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });

    this.belongsTo(models.User, {
      foreignKey: 'orderedById',
      as: 'orderedBy',
    });
  }
}
