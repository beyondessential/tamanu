import { Sequelize } from 'sequelize';
import { INVOICE_PRICE_CHANGE_ITEM_STATUSES, SYNC_DIRECTIONS } from '../constants';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';
import { dateType } from './dateTimeTypes';

export class InvoicePriceChangeItem extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        description: Sequelize.STRING,
        percentageChange: Sequelize.STRING,
        date: dateType('date'),
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: INVOICE_PRICE_CHANGE_ITEM_STATUSES.ACTIVE,
        },
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
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

  static getListReferenceAssociations(models) {
    return [
      {
        model: models.InvoicePriceChangeType,
        as: 'invoicePriceChangeType',
        include: models.InvoicePriceChangeType.getFullLinkedItemsInclude(models),
      },
      {
        model: models.User,
        as: 'orderedBy',
      },
    ];
  }

  static buildSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'invoices', 'encounters']);
  }
}
