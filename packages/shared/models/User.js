import { Sequelize, Model } from 'sequelize';

export class User extends Model {

  static init(options) {
    super.init({
      id: {
        type: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: Sequelize.STRING,
      password: Sequelize.STRING,
      displayName: Sequelize.STRING,
      name: Sequelize.STRING,
      anotherField: Sequelize.STRING,
    }, options); 
  }

}
