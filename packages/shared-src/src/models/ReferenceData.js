import { Sequelize, ValidationError } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

const CODE_TYPES = {
  ICD10: 'icd10',
  ALLERGY: 'allergy',
  CONDITION: 'condition',
  DRUG: 'drug',
  TRIAGE_REASON: 'triageReason',
  PROCEDURE_TYPE: 'procedureType',
  IMAGING_TYPE: 'imagingType',
  LAB_TEST_CATEGORY: 'labTestCategory',
  LAB_TEST_TYPE: 'labTestType',
  FACILITY: 'facility',
  LOCATION: 'location',
  DEPARTMENT: 'department',
  VILLAGE: 'village',
};

const CODE_TYPE_VALUES = Object.values(CODE_TYPES);

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
          type: Sequelize.ENUM(CODE_TYPE_VALUES),
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
    if (type && !CODE_TYPE_VALUES.includes(type)) {
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
