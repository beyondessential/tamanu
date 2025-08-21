import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class PortalOneTimeToken extends Model {
  declare id: string;
  declare type: string;
  declare token: string;
  declare expiresAt: Date;
  declare portalUserId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        type: { type: DataTypes.ENUM('login', 'register'), allowNull: false },
        token: { type: DataTypes.STRING, allowNull: false, defaultValue: 'login' },
        expiresAt: dateTimeType('expiresAt', {
          allowNull: false,
        }),
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  isExpired() {
    return this.expiresAt < new Date();
  }

  static initRelations(models: Models) {
    this.belongsTo(models.PortalUser, {
      foreignKey: {
        name: 'portalUserId',
        allowNull: false,
      },
      as: 'portalUser',
    });
  }
}
