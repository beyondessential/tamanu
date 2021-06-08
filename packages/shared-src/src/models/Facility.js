import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class Facility extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        division: Sequelize.STRING,
        type: Sequelize.STRING,
      },
      {
        ...options,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.Department, {
      foreignKey: 'facilityId',
    });
    this.hasMany(models.Location, {
      foreignKey: 'facilityId',
    });
    this.hasMany(models.UserFacility, {
      foreignKey: 'facilityId',
    });

    this.belongsToMany(models.User, {
      through: 'UserFacility',
    });
  }

  static syncDirection = SYNC_DIRECTIONS.PULL_ONLY;
}
