import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

// stores data written _by the server_
// e.g. which host did we last connect to?
export class LocalSystemFact extends Model {
  id!: string;
  key!: string;
  value?: string;

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

  static async get(key: string): Promise<string | undefined> {
    const result = await this.findOne({ where: { key } });
    return result?.value;
  }

  static async set(key: string, value?: string): Promise<void> {
    const existing = await this.findOne({ where: { key } });
    if (existing) {
      await this.update({ value }, { where: { key } });
    } else {
      await this.create({ key, value });
    }
  }

  static async incrementValue(key: string, amount: number = 1): Promise<number> {
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
    const fact = rowsAffected[0] as { value: number };
    return fact.value;
  }
}
