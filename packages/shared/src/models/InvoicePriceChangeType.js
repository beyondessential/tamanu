import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
import { Model } from './Model';

export class InvoicePriceChangeType extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        itemId: Sequelize.STRING,
        itemType: Sequelize.STRING,
        name: Sequelize.TEXT,
        percentageChange: Sequelize.STRING,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'itemId',
      as: 'patientBillingType',
      constraints: false,
    });
  }

  static getFullLinkedItemsInclude(models) {
    return [
      {
        model: models.ReferenceData,
        on: {
          itemId: Sequelize.where(
            Sequelize.col('invoicePriceChangeType->patientBillingType.id'),
            '=',
            Sequelize.col('invoicePriceChangeType.item_id'),
          ),
          itemType: Sequelize.where(
            Sequelize.col('invoicePriceChangeType->patientBillingType.type'),
            '=',
            'patientBillingType',
          ),
        },
        as: 'patientBillingType',
      },
    ];
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
