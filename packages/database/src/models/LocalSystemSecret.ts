import { DataTypes } from 'sequelize';
import { EndpointKey } from 'mushi';

import { SYNC_DIRECTIONS, FACT_DEVICE_KEY } from '@tamanu/constants';
import {
  encryptSecret,
  decryptSecret,
  isEncryptedSecret,
  readKeyFile,
  getConfigKeyFilePath,
} from '@tamanu/shared/utils/crypto';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

import type * as Facts from '@tamanu/constants/facts';
export type SecretName = (typeof Facts)[keyof typeof Facts];

// Server-only secrets (the device key, the reporting-role secret, the sync
// password). Kept in their own table rather than local_system_facts so the
// read-only `raw` reporting role — which is granted SELECT on all of `public` —
// can be excluded from it entirely. DO_NOT_SYNC and excluded from change logging
// (see migrations/constants.ts) so values never reach logs.changes either.
//
// Encryption is non-optional: every value is encrypted at rest with the server
// key file (config `crypto.keyFile`) via get/set/setIfAbsent. There is no
// plaintext accessor, so a secret can't accidentally be stored in the clear.
export class LocalSystemSecret extends Model {
  declare id: string;
  declare key: string;
  declare value?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        // separate key column to allow for future changes in allowable id format
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

  static async get(key: SecretName): Promise<string | null> {
    const result = await this.findOne({ where: { key } });
    const value = result?.value;
    if (!value) {
      return null;
    }
    if (isEncryptedSecret(value)) {
      const keyBuffer = await readKeyFile(getConfigKeyFilePath());
      return decryptSecret(keyBuffer, value);
    }
    // Legacy plaintext value (moved out of local_system_facts before encryption
    // was mandatory). Encrypt it in place on first read so nothing lingers in
    // the clear, then return the plaintext to the caller.
    // ponytail: self-heal on read keeps the move migration a plain SQL move
    await this.set(key, value);
    return value;
  }

  static async set(key: SecretName, value: string): Promise<void> {
    const keyBuffer = await readKeyFile(getConfigKeyFilePath());
    const encryptedValue = await encryptSecret(keyBuffer, value);
    const existing = await this.findOne({ where: { key } });
    if (existing) {
      await this.update({ value: encryptedValue }, { where: { key } });
    } else {
      // Generate the UUID in code rather than relying on the column default, so
      // this works on a blank Postgres 12 database (gen_random_uuid() isn't
      // available there yet). Mirrors LocalSystemFact.
      await this.create({ id: crypto.randomUUID(), key, value: encryptedValue });
    }
  }

  static async setIfAbsent(key: SecretName, value: string): Promise<void> {
    const keyBuffer = await readKeyFile(getConfigKeyFilePath());
    const encryptedValue = await encryptSecret(keyBuffer, value);
    await this.sequelize.query(
      `
        INSERT INTO local_system_secrets (key, value)
        VALUES ($key, $value)
        ON CONFLICT (key)
        DO NOTHING
      `,
      {
        bind: {
          key,
          value: encryptedValue,
        },
      },
    );
  }

  static async getDeviceKey(): Promise<EndpointKey> {
    const deviceKey = await this.get(FACT_DEVICE_KEY);
    if (deviceKey) {
      return new EndpointKey(deviceKey);
    }
    const newDeviceKey = EndpointKey.generateFor('ecdsa256');
    await this.set(FACT_DEVICE_KEY, newDeviceKey.privateKeyPem());
    return newDeviceKey;
  }
}
