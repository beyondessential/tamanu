import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class Asset extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: Sequelize.STRING,
        type: Sequelize.STRING,
        data: Sequelize.BLOB,
      },
      {
        ...options,
      },
    );
  }

  static sanitizeForSyncClient({ data, ...restOfValues }) {
    // Need to do this to import blob data properly, otherwise blob data will be truncated
    return { ...restOfValues, data: Buffer.from(data) };
  }

  static syncDirection = SYNC_DIRECTIONS.PULL_ONLY;
}
