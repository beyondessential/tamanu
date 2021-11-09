import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class InvoiceDiscountType extends Model {
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
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PULL_ONLY },
      },
    );
  }
}
