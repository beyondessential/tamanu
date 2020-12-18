import { hash } from 'bcrypt';
import { Sequelize } from 'sequelize';
import { Model } from './Model';
import config from 'config';

const DEFAULT_SALT_ROUNDS = 12;
const SALT_ROUNDS = config.db.saltRounds || DEFAULT_SALT_ROUNDS;

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
    if (password) {
      otherValues.password = await hash(password, SALT_ROUNDS);
    }
    return super.update(otherValues);
  }

  static async create(values) {
    const { password, ...otherValues } = values;
    if (password) {
      otherValues.password = await hash(password, SALT_ROUNDS);
    }
    return super.create(otherValues);
  }

  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
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
        role: {
          type: Sequelize.STRING,
          defaultValue: 'practitioner',
          allowNull: false,
        },
      },
      {
        ...options,
        indexes: [{ fields: ['email'] }],
      },
    );
  }
}
