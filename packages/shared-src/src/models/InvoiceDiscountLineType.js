import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class InvoiceDiscountLineType extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        item_id: Sequelize.STRING,
        item_type: Sequelize.STRING,
        discount: Sequelize.STRING,
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
      },
    );
  }
}
