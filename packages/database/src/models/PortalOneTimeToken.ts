import { DataTypes } from 'sequelize';
import { isBefore, parseISO } from 'date-fns';
import {
  SYNC_DIRECTIONS,
  PORTAL_ONE_TIME_TOKEN_TYPES,
  PORTAL_ONE_TIME_TOKEN_TYPE_VALUES,
} from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class PortalOneTimeToken extends Model {
  declare id: string;
  declare type: string;
  declare token: string;
  declare expiresAt: string;
  declare portalUserId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        type: {
          type: DataTypes.ENUM(...PORTAL_ONE_TIME_TOKEN_TYPE_VALUES),
          defaultValue: PORTAL_ONE_TIME_TOKEN_TYPES.LOGIN,
          allowNull: false,
        },
        token: { type: DataTypes.STRING, allowNull: false },
        expiresAt: dateTimeType('expiresAt', {
          allowNull: false,
        }),
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  isExpired() {
    return isBefore(parseISO(this.expiresAt), new Date());
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
