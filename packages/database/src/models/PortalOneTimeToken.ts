import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class PortalOneTimeToken extends Model {
  declare id: string;
  declare token: string;
  declare expiresAt: Date;
  declare portalUserId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        token: { type: DataTypes.STRING, allowNull: false },
        expiresAt: dateTimeType('expiresAt', {
          allowNull: false,
        }),
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL },
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
