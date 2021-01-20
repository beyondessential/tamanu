import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class Attachment extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        size: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        filename: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        contentType: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        ...options,
      },
    );
  }
}
