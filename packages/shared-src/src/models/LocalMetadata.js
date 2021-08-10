import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class LocalMetadata extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        // use a separate key to allow for future changes in allowable id format
        key: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        value: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
      },
      {
        ...options,
        indexes: [{ unique: true, fields: ['key'] }],
      },
    );
  }

  static async get(key) {
    const { value } = await this.findOne({ where: { key } });
    return value;
  }

  static async set(key, value) {
    await this.upsert({ key, value }, { fields: ['key'] });
  }
}
