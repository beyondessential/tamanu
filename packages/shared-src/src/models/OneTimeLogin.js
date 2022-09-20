import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';

export class OneTimeLogin extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        token: { type: Sequelize.STRING, allowNull: false },
        expiresAt: dateTimeType('expiresAt', { allowNull: false }),
        usedAt: dateTimeType('usedAt', { allowNull: false }),
      },
      options,
    );
  }

  isExpired() {
    return this.expiresAt < new Date();
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      as: 'user',
    });
  }
}
