import { Sequelize } from 'sequelize';
import { Model } from './Model';

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
}
