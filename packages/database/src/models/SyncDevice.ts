import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { User } from './User';
import { ed25519 } from '@noble/curves/ed25519';
import type { Hex } from '@noble/curves/abstract/utils';

const ED25519_KEY_LENGTH = 32;

export class SyncDevice extends Model {
  declare id: string;
  declare lastPersistedAtSyncTick: number;
  declare registeredById?: string;
  declare registeredBy?: User;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.TEXT,
          primaryKey: true,
        },
        lastPersistedAtSyncTick: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        registeredById: {
          type: DataTypes.STRING,
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
    this.belongsTo(models.User, {
      foreignKey: 'registeredById',
      as: 'registeredBy',
    });
  }

  asPublicKey(): Uint8Array | null {
    // public keys are hex-encoded
    if (!/^[0-9a-fA-F]+$/.test(this.id)) return null;

    const key = Buffer.from(this.id, 'hex');

    // this will false-positive in the case of 64-byte legacy device IDs
    // but that shouldn't happen as old device IDs were generated as 16-23 chars
    if (key.length !== ED25519_KEY_LENGTH) return null;

    return key;
  }

  verifySignature(message: Hex, signature: Hex): boolean {
    const key = this.asPublicKey();
    if (key === null) {
      return false;
    }

    return ed25519.verify(signature, message, key);
  }

  /** Verify a signature without having an existing SyncDevice */
  static verifySignatureFromPublicKey(message: Hex, signature: Hex, publicKey: Hex): boolean {
    return ed25519.verify(signature, message, publicKey);
  }

  /** For testing: generate a valid new device ID (ed25519 pubkey) */
  static createDeviceId(): string {
    const pkey = new Uint8Array(ED25519_KEY_LENGTH);
    crypto.getRandomValues(pkey);
    return Buffer.from(ed25519.getPublicKey(pkey)).toString('hex');
  }

  static async registerNewDevice(id: string, user: User): Promise<SyncDevice> {
    if ((await this.count({ where: { id } })) > 0) {
      throw new Error('Device already registered');
    }

    const devicesRegisteredByUser = await this.count({ where: { registeredById: user.id } });
    if (devicesRegisteredByUser >= user.deviceRegistrationQuota) {
      throw new Error('User has reached the maximum number of registered devices');
    }

    return this.create({
      id,
      lastPersistedAtSyncTick: 0,
      registeredById: user.id,
    });
  }

  static async findOrRegister(id: string, user: User): Promise<SyncDevice> {
    const device = await this.findByPk(id);
    if (device) {
      return device;
    }

    return this.registerNewDevice(id, user);
  }
}
