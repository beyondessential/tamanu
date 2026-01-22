import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';
import type { ModelSanitizeArgs } from '../types/sync';

export class Asset extends Model {
  declare id: string;
  declare name?: string;
  declare type?: string;
  declare data?: Buffer;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        name: DataTypes.STRING,
        type: DataTypes.STRING,
        data: DataTypes.BLOB,
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
  static sanitizeForCentralServer({ data, ...restOfValues }: ModelSanitizeArgs) {
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

  static sanitizeForFacilityServer({ data, ...restOfValues }: { data: any; [key: string]: any }) {
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

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
