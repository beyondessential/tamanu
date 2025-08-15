import { DataTypes } from 'sequelize';
import { EndpointKey } from 'mushi';

import { SYNC_DIRECTIONS, FACT_DEVICE_KEY, FACT_LOOKUP_MODELS_TO_REBUILD } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';
import { randomUUID } from 'node:crypto';

import type * as Facts from '@tamanu/constants/facts';
export type FactName = (typeof Facts)[keyof typeof Facts];

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

  static async get(key: FactName) {
    const result = await this.findOne({ where: { key } });
    return result?.value;
  }

  static async set(key: FactName, value?: string) {
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

  static async incrementValue(key: FactName, amount: number = 1) {
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

  static async getDeviceKey() {
    const deviceKey = await this.get(FACT_DEVICE_KEY);
    if (deviceKey) {
      return new EndpointKey(deviceKey);
    }
    const newDeviceKey = EndpointKey.generateFor('ecdsa256');
    await this.set(FACT_DEVICE_KEY, newDeviceKey.privateKeyPem());
    return newDeviceKey;
  }

  static async getLookupModelsToRebuild() {
    const value = await this.get(FACT_LOOKUP_MODELS_TO_REBUILD);
    if (!value) {
      return [];
    }
    return value.split(',').map((model) => model.trim());
  }

  static async markLookupModelRebuilt(modelName: string) {
    await this.sequelize.query(
      `
        UPDATE local_system_facts
	      SET value = array_to_string(array_remove(string_to_array(value, ','), :modelName), ',')
	      WHERE key = :key
    `,
      {
        replacements: {
          modelName,
          key: FACT_LOOKUP_MODELS_TO_REBUILD,
        },
      },
    );
  }
}
