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
  declare lastScrubbedAt: Date | null;
  declare eligibleSinceTick: number | null;
  declare hasParity: boolean;
  declare correctionCount: number;
  declare lastCorrectedAt: Date | null;

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
        // spec: SCRUB
        // When the scrub last verified this blob against its hash. Null until
        // first scrubbed, which the scrub's least-recently-scrubbed-first scan
        // takes ahead of any stamped row. The result of that verification is
        // the integrity state above, as at this time.
        lastScrubbedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        // spec: CAP
        // The push cursor at the moment this blob was first observed eligible
        // for push (its referencing record had synced). Null while not yet
        // eligible; cleared on demotion to cache. The outbox dysfunction
        // measure compares it against the current push cursor.
        eligibleSinceTick: {
          type: DataTypes.BIGINT,
          allowNull: true,
          // Postgres returns BIGINT as a string; callers compare it against the
          // numeric sync tick.
          get(this: Blob): number | null {
            const value = this.getDataValue('eligibleSinceTick');
            return value == null ? null : Number(value);
          },
        },
        // spec: FEC
        // Whether a parity sidecar is stored alongside this blob's content. The
        // scrub's retrofit finds covered blobs without one, so enabling error
        // correction brings existing content under protection.
        hasParity: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        // spec: FEC
        // Repairs made from this blob's parity. A rising rate of correction
        // across the store is failing media, which calls for replacing the disk
        // rather than for recovering content.
        correctionCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        lastCorrectedAt: {
          type: DataTypes.DATE,
          allowNull: true,
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
