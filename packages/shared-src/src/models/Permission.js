import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class Permission extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        verb: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        noun: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        objectId: Sequelize.STRING,
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PULL_ONLY },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Role, {
      as: 'role',
      foreignKey: 'roleId',
    });
  }

  forResponse() {
    const { noun, verb, objectId } = this.dataValues;
    return {
      verb,
      noun,
      ... objectId ? { objectId } : undefined,
    };
  }
}
