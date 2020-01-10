import { Sequelize, Model } from 'sequelize';

export class User extends Model {

  static init(options) {
    super.init({
      id: {
        type: Sequelize.UUID,
        defaultValue: options.createId,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: Sequelize.STRING,
      displayName: Sequelize.STRING,
    }, {
      ...options,
      indexes: [
        { fields: ['email'] },
      ]
    }); 
  }

}
