import { DataTypes } from 'sequelize';

import {
  BLOB_INTEGRITY_STATES,
  BLOB_TIERS,
  SYNC_DIRECTIONS,
  type BlobIntegrityState,
  type BlobTier,
} from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

// spec: CAS
// The local blob registry: one row per blob held in this server's on-disk
// store, keyed by algorithm-tagged hash. On the central server it is the
// authoritative record of which content exists and its verification state; on
// a facility or mobile server it is a cache index. Local to each server:
// DO_NOT_SYNC and excluded from change logging (see migrations/constants.ts).
export class Blob extends Model {
  declare id: string;
  declare hash: string;
  declare size: number;
  declare integrityState: BlobIntegrityState;
  declare tier: BlobTier;
  declare lastAccessedAt: Date;
  declare syncCyclesUnpushed: number;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        hash: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        size: {
          type: DataTypes.BIGINT,
          allowNull: false,
          // Postgres hands BIGINT back as a string, and callers do arithmetic
          // on blob sizes.
          get(this: Blob): number {
            return Number(this.getDataValue('size'));
          },
        },
        integrityState: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: BLOB_INTEGRITY_STATES.VERIFIED,
        },
        // spec: CACHE
        // Facility/mobile durability tier: an outbox blob is the only durable
        // copy and never evicted; a cache blob is durable on central and
        // evictable. Not consulted on the central server.
        tier: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: BLOB_TIERS.CACHE,
        },
        // spec: CACHE
        // LRU recency: set at admission (column default), refreshed on reads —
        // possibly coalesced, so it is a lower bound on the true last access.
        lastAccessedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        // spec: CAP
        // Successful sync cycles this blob has survived in the outbox while
        // eligible for push and not being attempted; the outbox dysfunction
        // measure. Zeroed on demotion to cache.
        syncCyclesUnpushed: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        indexes: [{ unique: true, fields: ['hash'] }],
      },
    );
  }
}
