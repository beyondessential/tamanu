import { Sequelize, ValidationError } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';
import { REFERENCE_TYPE_VALUES } from '../constants';

export class ReferenceData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: {
          type: Sequelize.STRING,
          defaultValue: primaryKey.defaultValue,
          primaryKey: true,
        },
        code: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        type: {
          type: Sequelize.ENUM(REFERENCE_TYPE_VALUES),
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        ...options,
        indexes: [
          {
            unique: false,
            fields: ['type'],
          },
          {
            unique: false,
            name: 'code_by_type',
            fields: ['code', 'type'],
          },
        ],
      },
    );
  }

  static async create(values) {
    // the type column is just text in sqlite so validate it here
    const { type } = values;
    if (type && !REFERENCE_TYPE_VALUES.includes(type)) {
      throw new ValidationError(`Invalid type: ${type}`);
    }
    return super.create(values);
  }

  async update(values) {
    if (values.type) {
      throw new InvalidOperationError('The type of a reference data item cannot be changed');
    }
    return super.update(values);
  }
}
