import { Sequelize, Model, ValidationError } from 'sequelize';
import { InvalidOperationError } from 'lan/app/errors';

const CODE_TYPES = [
  'icd10',
  'allergy',
  'condition',
  'drug',
  'triageReason',
  'procedureType',
  'imagingType',
  'labTestCategory',
  'labTestType',

  'facility',
  'location',
  'department',
];

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
          type: Sequelize.ENUM(CODE_TYPES),
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
    if(type && !CODE_TYPES.includes(type)) {
      throw new ValidationError("Invalid type: " + type);
    }
    return super.create(values);
  }

  async update(values) {
    if(values.type) {
      throw new InvalidOperationError("The type of a reference data item cannot be changed");
    }
    return super.update(values);
  }
}
