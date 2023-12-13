import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class Role extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.Permission, {
      as: 'permissions',
      foreignKey: 'roleId',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
