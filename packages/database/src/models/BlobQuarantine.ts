import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

// spec: AV
// Written on central and pulled everywhere, keyed by hash, so it stands whether or not a server
// holds the bytes.
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
        // Kept for a false-positive review.
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
    return null;
  }

  static async buildSyncLookupQueryDetails() {
    return null;
  }
}
