import { DataTypes } from 'sequelize';

import {
  BLOB_INTEGRITY_STATES,
  BLOB_TIERS,
  SYNC_DIRECTIONS,
  type BlobIntegrityState,
  type BlobScanVerdict,
  type BlobTier,
} from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

// spec: CAS
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
  declare scanVerdict: BlobScanVerdict | null;
  declare scannedAt: Date | null;
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
        size: {
          type: DataTypes.BIGINT,
          allowNull: false,
          // Postgres hands BIGINT back as a string.
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
        // Not consulted on central.
        tier: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: BLOB_TIERS.CACHE,
        },
        // spec: CACHE
        // Refreshes may be coalesced, so this is a lower bound on the true last access.
        lastAccessedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        // spec: SCRUB
        // Null sorts ahead of any stamped row in the least-recently-scrubbed scan.
        lastScrubbedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        // spec: CAP
        // Cleared on demotion to cache.
        eligibleSinceTick: {
          type: DataTypes.BIGINT,
          allowNull: true,
          // Postgres hands BIGINT back as a string.
          get(this: Blob): number | null {
            const value = this.getDataValue('eligibleSinceTick');
            return value == null ? null : Number(value);
          },
        },
        // spec: FEC
        hasParity: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        // spec: FEC
        // A rising rate across the store means failing media.
        correctionCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        lastCorrectedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        // spec: AV
        // Null verdict means not yet scanned.
        scanVerdict: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        scannedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
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
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        indexes: [{ unique: true, fields: ['hash'] }],
      },
    );
  }
}
