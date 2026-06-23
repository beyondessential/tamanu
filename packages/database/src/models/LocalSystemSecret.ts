import { DataTypes } from 'sequelize';
import { EndpointKey } from 'mushi';

import { SYNC_DIRECTIONS, FACT_DEVICE_KEY } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

import type * as Facts from '@tamanu/constants/facts';
export type SecretName = (typeof Facts)[keyof typeof Facts];

// Sensitive server-only values (the device key, the reporting-role secret).
// Kept in their own table rather than local_system_facts so the read-only `raw`
// reporting role — which is granted SELECT on all of `public` — can be excluded
// from it while still reading the non-secret operational facts. DO_NOT_SYNC and
// excluded from change logging (see migrations/constants.ts) so the values are
// never copied into logs.changes either.
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
    return result?.value ?? null;
  }

  static async set(key: SecretName, value?: string): Promise<void> {
    const existing = await this.findOne({ where: { key } });
    if (existing) {
      await this.update({ value }, { where: { key } });
    } else {
      // Generate the UUID in code rather than relying on the column default, so
      // this works on a blank Postgres 12 database (gen_random_uuid() isn't
      // available there yet). Mirrors LocalSystemFact.
      await this.create({ id: crypto.randomUUID(), key, value });
    }
  }

  static async setIfAbsent(key: SecretName, value?: string): Promise<void> {
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
          value,
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
