import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

// spec: AV
// A hash known to name malware. Central scans and its verdict is authoritative,
// so these are written on central and pulled everywhere: a facility or device
// that runs no scanner of its own still knows not to serve, fetch, or heal the
// content. The record is content-addressed rather than tied to any copy of the
// content, so it stands whether or not this server holds the bytes, and it
// still stands when a copy arrives later.
export class BlobQuarantine extends Model {
  declare id: string;
  declare hash: string;
  declare scannerVersion: string | null;
  declare signatureVersion: string | null;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        hash: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        // What found it, kept for the review a false positive needs: a verdict
        // is only as good as the signatures behind it.
        scannerVersion: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        signatureVersion: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [{ unique: true, fields: ['hash'] }],
      },
    );
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
