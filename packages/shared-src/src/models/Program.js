import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { SYNC_DIRECTIONS } from 'shared/constants';

export class Program extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: Sequelize.STRING,
        name: Sequelize.STRING,
      },
      {
        ...options,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.Survey, {
      as: 'surveys',
      foreignKey: 'programId',
    });
  }

  static syncDirection = SYNC_DIRECTIONS.PULL_ONLY;
}
