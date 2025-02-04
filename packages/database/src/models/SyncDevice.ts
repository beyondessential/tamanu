import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { User } from './User';
import { ed25519 } from '@noble/curves/ed25519';
import type { Hex } from '@noble/curves/abstract/utils';

const ED25519_KEY_LENGTH = 32;

export class SyncDevice extends Model {
  declare id: Uint8Array;
  declare persistedAtSyncTick: number;
  declare registeredById?: string;
  declare registeredBy?: User;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.BLOB,
          primaryKey: true,
        },
        persistedAtSyncTick: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        registeredById: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        timestamps: false,
      },
    );
  }

  static initRelations(models: Models) {
    this.hasMany(models.User, {
      foreignKey: 'registeredById',
      as: 'registeredBy',
    });
  }

  isPublicKey(): boolean {
    // this will false-positive in the case of 32-byte legacy device IDs
    // but that shouldn't happen as old device IDs were generated as 16-23 chars
    return this.id.length === ED25519_KEY_LENGTH;
  }

  verifySignature(message: Hex, signature: Hex): boolean {
    if (!this.isPublicKey()) {
      return false;
    }

    return ed25519.verify(signature, message, this.id);
  }
}
