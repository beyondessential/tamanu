import { Sequelize } from 'sequelize';
import { INVOICE_LINE_ITEM_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';
import { dateType } from './dateTimeTypes';

export class InvoiceLineItem extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        percentageChange: Sequelize.DECIMAL,
        dateGenerated: dateType('dateGenerated'),
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: INVOICE_LINE_ITEM_STATUSES.ACTIVE,
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

    this.belongsTo(models.InvoiceLineType, {
      foreignKey: 'invoiceLineTypeId',
      as: 'invoiceLineType',
    });

    this.belongsTo(models.User, {
      foreignKey: 'orderedById',
      as: 'orderedBy',
    });
  }

  static getListReferenceAssociations(models) {
    return [
      {
        model: models.InvoiceLineType,
        as: 'invoiceLineType',
        include: models.InvoiceLineType.getFullLinkedItemsInclude(models),
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
