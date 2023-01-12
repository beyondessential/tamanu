import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
import { Model } from './Model';

export class RefreshToken extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        token: { type: Sequelize.STRING, allowNull: false },
        expiresAt: { type: Sequelize.DATE, allowNull: false },
      },
      { syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC, ...options },
    );
  }
}
