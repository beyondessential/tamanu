import { hash } from 'bcrypt';
import { Sequelize } from 'sequelize';
import { Model } from './Model';

const DEFAULT_SALT_ROUNDS = 10;

export class User extends Model {
  forResponse() {
    const { password, ...otherValues } = this.dataValues;
    return otherValues;
  }

  async setPassword(pw) {
    const hashedPassword = await hash(pw, this.SALT_ROUNDS);
    this.password = hashedPassword;
  }

  static async update(values, ...args) {
    const { password, ...otherValues } = values;
    if (password) {
      otherValues.password = await hash(password, this.SALT_ROUNDS);
    }
    return super.update(otherValues, ...args);
  }

  static async create(values, ...args) {
    const { password, ...otherValues } = values;
    if (password) {
      otherValues.password = await hash(password, this.SALT_ROUNDS);
    }
    return super.create(otherValues, ...args);
  }

  static async upsert(values, ...args) {
    const { password, ...otherValues } = values;
    if (password) {
      otherValues.password = await hash(password, this.SALT_ROUNDS);
    }
    return super.upsert(otherValues, ...args);
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

    this.SALT_ROUNDS = this.SALT_ROUNDS || DEFAULT_SALT_ROUNDS;
  }
}
