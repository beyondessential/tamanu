import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class InvoiceDiscountLineType extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        itemId: Sequelize.STRING,
        itemType: Sequelize.STRING,
        name: Sequelize.TEXT,
        discount: Sequelize.STRING,
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PULL_ONLY },
      },
    );
  }
}
