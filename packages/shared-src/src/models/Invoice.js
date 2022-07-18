import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { EncounterLinkedModel } from './EncounterLinkedModel';

export class Invoice extends EncounterLinkedModel {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        displayId: Sequelize.STRING,
        status: Sequelize.STRING,
        total: Sequelize.DECIMAL,
        paymentStatus: Sequelize.STRING,
        receiptNumber: Sequelize.STRING,
        date: Sequelize.DATE,
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.hasMany(models.InvoiceLineItem, {
      foreignKey: 'invoiceId',
      as: 'invoiceLineItems',
    });

    this.hasMany(models.InvoicePriceChangeItem, {
      foreignKey: 'invoiceId',
      as: 'invoicePriceChangeItems',
    });
  }
}
