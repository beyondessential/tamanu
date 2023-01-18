import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
import { Model } from './Model';

export class RefreshToken extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        refreshId: { type: Sequelize.TEXT, allowNull: false },
        deviceId: { type: Sequelize.TEXT, allowNull: false },
        expiresAt: { type: Sequelize.DATE, allowNull: false },
      },
      {
        indexes: [
          {
            name: 'refresh_tokens_user_id_device_id',
            fields: ['user_id', 'device_id'],
            unique: true,
          },
        ],
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        ...options,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, { foreignKey: 'userId' });
  }
}
