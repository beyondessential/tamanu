import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class Program extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: Sequelize.STRING,
      },
      options,
    );
  }

  static initRelations(models) {
    this.hasMany(models.Survey, {
      as: 'surveys',
    });
  }
}
