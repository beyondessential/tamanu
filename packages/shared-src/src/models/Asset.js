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

  /**
   * This is only used when inserting asset manually through RestClient
   * Asset is PULL_ONLY and we don't sync asset up from devices to sync servers.
   */
  static sanitizeForSyncServer({ data, ...restOfValues }) {
    //base64
    if (typeof data === 'string') {
      return { ...restOfValues, data: Buffer.from(data, 'base64') };
    }
    return { ...restOfValues, data: Buffer.from(data) };
  }

  static sanitizeForSyncClient({ data, ...restOfValues }) {
    // Need to do this to import blob data properly when pulling,
    // otherwise blob data will be truncated
    return { ...restOfValues, data: Buffer.from(data) };
  }

  static syncDirection = SYNC_DIRECTIONS.PULL_ONLY;
}
