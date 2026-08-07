import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { ModelSanitizeArgs } from '../types/sync';

export class Asset extends Model {
  declare id: string;
  declare name?: string;
  declare type?: string;
  declare data?: Buffer | null;
  declare hash?: string | null;
  declare facilityId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        name: DataTypes.STRING,
        type: DataTypes.STRING,
        // spec: BKFL — bytes until the backfill moves them, hash afterwards.
        data: DataTypes.BLOB,
        hash: DataTypes.TEXT,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  }

  /**
   * This is only used when inserting asset manually through RestClient
   * Asset is PULL_FROM_CENTRAL, i.e. we don't sync asset up from devices to sync servers.
   */
  static sanitizeForCentralServer({ data, ...restOfValues }: ModelSanitizeArgs) {
    // A backfilled asset carries its hash instead of its bytes (spec: BKFL).
    if (data === null || data === undefined) {
      return { ...restOfValues, data: null };
    }

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
    // A backfilled asset carries its hash instead of its bytes (spec: BKFL).
    if (data === null || data === undefined) {
      return { ...restOfValues, data: null };
    }

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
