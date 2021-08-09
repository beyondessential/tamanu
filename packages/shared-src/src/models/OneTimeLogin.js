import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class OneTimeLogin extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        userId: { type: Sequelize.STRING, allowNull: false },
        token: { type: Sequelize.STRING, allowNull: false },
        expiresAt: { type: Sequelize.DATE, allowNull: false },
        usedAt: { type: Sequelize.DATE, allowNull: true },
      },
      options,
    );
  }

  isExpired() {
    return this.expiresAt < new Date();
  }
}
