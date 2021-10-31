import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class InvoiceDiscountLineItem extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        description: Sequelize.STRING,
        discount: Sequelize.STRING,
        date: Sequelize.DATEONLY,
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

    this.belongsTo(models.InvoiceDiscountLineType, {
      foreignKey: 'invoiceDiscountLineTypeId',
      as: 'invoiceDiscountLineType',
    });

    this.belongsTo(models.User, {
      foreignKey: 'orderedBy',
      as: 'orderedBy',
    });
  }
}
