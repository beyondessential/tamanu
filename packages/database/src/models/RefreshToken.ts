import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class RefreshToken extends Model {
  id!: string;
  refreshId!: string;
  deviceId!: string;
  expiresAt!: Date;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        refreshId: { type: DataTypes.TEXT, allowNull: false },
        deviceId: { type: DataTypes.TEXT, allowNull: false },
        expiresAt: { type: DataTypes.DATE, allowNull: false },
      },
      {
        indexes: [
          {
            name: 'refresh_tokens_user_id_device_id',
            fields: ['user_id', 'device_id'],
            unique: true,
          },
        ],
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, { foreignKey: 'userId' });
  }
}
