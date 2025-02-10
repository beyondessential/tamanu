import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { randomUUID } from 'node:crypto';
import { ed25519 } from '@noble/curves/ed25519';
import * as uuid from 'uuid';
import type { Hex } from '@noble/curves/abstract/utils';

import type { InitOptions } from '../types/model';
import { SECRET_KEY_KEY, SESSION_ID_NAMESPACE_KEY } from '../sync/constants';

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

  static #secretKey: Uint8Array;

  /**
   * Generate and store a keypair for this device, if it doesn't exist already.
   * @returns The secret key of the keypair
   */
  static async #initialiseKeypair(): Promise<Uint8Array> {
    if (!this.#secretKey) {
      await this.sequelize.query(
        `
          INSERT INTO local_system_facts (key, value)
          VALUES ($key, encode(gen_random_bytes(32), 'hex'))
          ON CONFLICT DO NOTHING
        `,
        {
          bind: { key: SECRET_KEY_KEY },
        },
      );

      const key = await this.get(SECRET_KEY_KEY);
      if (!key) {
        throw new Error('secret key failed to generate');
      }
      this.#secretKey = Buffer.from(key, 'hex');
    }

    return this.#secretKey;
  }

  /** The device's ID is its public key in hex */
  static async deviceId(): Promise<string> {
    const secretKey = await this.#initialiseKeypair();
    const publicKey = ed25519.getPublicKey(secretKey);
    return Buffer.from(publicKey).toString('hex');
  }

  /** Sign a message using the device's private key. */
  static async sign(message: Uint8Array): Promise<Uint8Array> {
    const secretKey = await this.#initialiseKeypair();
    return ed25519.sign(message, secretKey);
  }

  /** Verify a signature using the device's public key. */
  static async verifySignature(message: Uint8Array, signature: Uint8Array): Promise<boolean> {
    const secretKey = await this.#initialiseKeypair();
    const publicKey = ed25519.getPublicKey(secretKey);
    return ed25519.verify(signature, message, publicKey);
  }

  static async newSessionId(nonce: Hex): Promise<string> {
    let namespace = await this.get(SESSION_ID_NAMESPACE_KEY);
    if (!namespace) {
      namespace = uuid.v4();
      await this.set(SESSION_ID_NAMESPACE_KEY, namespace);
    }

    const nonceString = nonce instanceof Uint8Array ? Buffer.from(nonce).toString('hex') : nonce;
    return uuid.v5(nonceString, namespace);
  }
}
