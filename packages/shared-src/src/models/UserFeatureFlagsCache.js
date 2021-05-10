import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class UserFeatureFlagsCache extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        featureFlags: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      options,
    );
  }
  
  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }
}
