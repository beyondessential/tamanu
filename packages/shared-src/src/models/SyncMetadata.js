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
        },
        lastSynced: {
          type: Sequelize.BIGINT,
          defaultValue: 0,
        }
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
