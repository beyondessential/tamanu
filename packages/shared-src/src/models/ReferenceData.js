import { Sequelize, ValidationError } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { REFERENCE_TYPE_VALUES, SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class ReferenceData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        type: {
          type: Sequelize.STRING(31),
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
        syncConfig: {
          syncDirection: SYNC_DIRECTIONS.PULL_ONLY,
          getChannels: () => ['reference'],
          channelRoutes: [{ route: 'reference' }],
        },
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
