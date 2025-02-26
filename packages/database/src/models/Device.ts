import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { User } from './User';

export interface DeviceMetadata {
  // updated at sync completion
  lastSyncTick?: number;

  // obtained from connection
  remoteIp?: string;
  userAgent?: string;
  targetHost?: string;
  tlsVersion?: string;
}

export class Device extends Model {
  declare id: string;
  declare publicKey?: Uint8Array;
  declare metadata: DeviceMetadata;
  declare canLogin: boolean;
  declare canSync: boolean;
  declare canRebind: boolean;
  declare registeredBy: User;
  declare registeredById: string;
  declare lastLoginBy: User;
  declare lastLoginById: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: {
          ...primaryKey,
          type: DataTypes.UUID,
        },

        // When present, this is an ED25519 public key in raw form (32 bytes)
        // Used to trust that connections come from a specific known device
        // As this is a public key there's no need to store it securely
        publicKey: {
          type: DataTypes.BLOB,
          allowNull: true,
        },

        // Various non-essential fields for debug/audit, see the DeviceMetadata interface
        // Note that this table is change-logged, so a history is kept
        metadata: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },

        // Controls whether this device can obtain a token at login
        canLogin: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },

        // Controls whether this device can sync
        canSync: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },

        // On login, if the authenticating user ID is different from the lastLoginBy:
        // - canRebind=true  => lastLoginBy is updated, auth continues
        // - canRebind=false => auth fails
        canRebind: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }

  static initRelations(models: Models) {
    // Immutable, used for registration quota
    this.belongsTo(models.User, {
      foreignKey: 'registeredById',
      as: 'registeredBy',
    });

    // Mutable if canRebind=true
    this.belongsTo(models.User, {
      foreignKey: 'lastLoginById',
      as: 'lastLoginBy',
    });

    // Relationship reciprocals
    this.hasOne(models.SyncQueuedDevice, {
      foreignKey: 'id',
      as: 'syncQueue',
    });
    this.hasMany(models.SyncDeviceTick, {
      foreignKey: 'deviceId',
      as: 'syncTicks',
    });
  }
}
