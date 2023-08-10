import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
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
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  /**
   * This is only used when inserting asset manually through RestClient
   * Asset is PULL_FROM_CENTRAL, i.e. we don't sync asset up from devices to sync servers.
   */
  static sanitizeForCentralServer({ data, ...restOfValues }) {
    // Postgres-format hex string of binary data
    if (typeof data === 'string' && data.substring(0, 2) === '\\x') {
      return { ...restOfValues, data: Buffer.from(data.substring(2), 'hex') };
    }

    // Other strings: assume base64
    if (typeof data === 'string') {
      return { ...restOfValues, data: Buffer.from(data, 'base64') };
    }

    return { ...restOfValues, data: Buffer.from(data) };
  }

  static sanitizeForFacilityServer({ data, ...restOfValues }) {
    // Postgres-format hex string of binary data
    if (typeof data === 'string' && data.substring(0, 2) === '\\x') {
      return { ...restOfValues, data: Buffer.from(data.substring(2), 'hex') };
    }

    // Anything else that Buffer natively supports
    return { ...restOfValues, data: Buffer.from(data) };
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
