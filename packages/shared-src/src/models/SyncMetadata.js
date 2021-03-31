import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class SyncMetadata extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        channel: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        pullCursor: {
          type: Sequelize.STRING,
          defaultValue: '0',
        },
      },
      {
        ...options,
        indexes: [
          {
            unique: true,
            fields: ['channel'],
          },
        ],
      },
    );
  }
}
