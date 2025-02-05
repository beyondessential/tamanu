import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';
import { randomUUID } from 'node:crypto';
import { ed25519 } from '@noble/curves/ed25519';
import * as uuid from 'uuid';
import type { Hex } from '@noble/curves/abstract/utils';

// stores data written _by the server_
// e.g. which host did we last connect to?
export class LocalSystemFact extends Model {
  declare id: string;
  declare key: string;
  declare value?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        // use a separate key to allow for future changes in allowable id format
        key: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        value: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        indexes: [{ unique: true, fields: ['key'] }],
      },
    );
  }

  static async get(key: string) {
    const result = await this.findOne({ where: { key } });
    return result?.value;
  }

  static async set(key: string, value?: string) {
    const existing = await this.findOne({ where: { key } });
    if (existing) {
      await this.update({ value }, { where: { key } });
    } else {
      // This function is used in the migration code, and in Postgres
      // version 12 `gen_random_uuid()` is not available in a blank
      // database, and it's used to default the ID. So instead, create
      // random UUIDs here in code, so the default isn't invoked. We
      // use Node's native function so it's just as fast.
      await this.create({ id: randomUUID(), key, value });
    }
  }

  static async incrementValue(key: string, amount: number = 1) {
    const [rowsAffected] = await this.sequelize.query(
      `
        UPDATE
          local_system_facts
        SET
          value = value::integer + :amount,
          updated_at = NOW()
        WHERE
          key = :key
        RETURNING
          value;
      `,
      { replacements: { key, amount } },
    );
    if (rowsAffected.length === 0) {
      throw new Error(`The local system fact table does not include the fact ${key}`);
    }
    const fact = rowsAffected[0] as LocalSystemFact;
    return fact.value;
  }

  /**
   * Generate and store a new keypair for this device.
   * @returns The public key of the new keypair
   */
  static async initialiseKeypair(): Promise<Uint8Array> {
    if (await this.get('sync.secretKey')) {
      throw new Error('Keypair already exists');
    }

    const secretKey = ed25519.utils.randomPrivateKey();
    await this.set('sync.secretKey', Buffer.from(secretKey).toString('hex'));
    return ed25519.getPublicKey(secretKey);
  }

  /** The device's ID is its public key in hex */
  static async deviceId(): Promise<string> {
    const secretKey = await this.get('sync.secretKey');
    if (!secretKey) {
      await this.initialiseKeypair();
      return this.deviceId();
    }

    const publicKey = ed25519.getPublicKey(Buffer.from(secretKey, 'hex'));
    return Buffer.from(publicKey).toString('hex');
  }

  /** Sign a message using the device's private key. */
  static async sign(message: Uint8Array): Promise<Uint8Array> {
    const secretKey = await this.get('sync.secretKey');
    if (!secretKey) {
      await this.initialiseKeypair();
      return this.sign(message);
    }

    return ed25519.sign(message, Buffer.from(secretKey, 'hex'));
  }

  /** Verify a signature using the device's public key. */
  static async verifySignature(message: Uint8Array, signature: Uint8Array): Promise<boolean> {
    const secretKey = await this.get('sync.secretKey');
    if (!secretKey) {
      return false;
    }

    const publicKey = ed25519.getPublicKey(Buffer.from(secretKey, 'hex'));
    return ed25519.verify(signature, message, publicKey);
  }

  static async newSessionId(nonce: Hex): Promise<string> {
    let namespace = await this.get('sync.sessionIdNamespace');
    if (!namespace) {
      namespace = uuid.v4();
      await this.set('sync.sessionIdNamespace', namespace);
    }

    const nonceString = nonce instanceof Uint8Array ? Buffer.from(nonce).toString('hex') : nonce;
    return uuid.v5(nonceString, namespace);
  }
}
