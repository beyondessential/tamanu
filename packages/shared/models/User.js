import { Sequelize, Model } from 'sequelize';
import { hash, compare } from 'bcrypt';

const SALT_ROUNDS = 10;

export class User extends Model {

  forResponse() {
    const { password, ...otherValues } = this.dataValues;
    return otherValues;
  }

  async setPassword(pw) {
    const hashedPassword = await hash(pw, SALT_ROUNDS);
    this.password = hashedPassword;
  }

  async update(values) {
    const { password, ...otherValues } = values;
    if(password) {
      otherValues.password = await hash(password, SALT_ROUNDS);
    }
    return super.update(otherValues);
  }

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
      displayName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    }, {
      ...options,
      indexes: [
        { fields: ['email'] },
      ]
    }); 
  }

}
