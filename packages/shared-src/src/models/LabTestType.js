import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

const QUESTION_TYPES = {
  NUMBER: 'number',
  STRING: 'string',
};

const QUESTION_TYPE_VALUES = Object.values(QUESTION_TYPES);

export class LabTestType extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        code: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: '',
        },
        unit: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: '',
        },
        maleMin: Sequelize.FLOAT,
        maleMax: Sequelize.FLOAT,
        femaleMin: Sequelize.FLOAT,
        femaleMax: Sequelize.FLOAT,
        rangeText: Sequelize.STRING,
        questionType: {
          type: Sequelize.ENUM(QUESTION_TYPE_VALUES),
          allowNull: false,
          defaultValue: QUESTION_TYPES.NUMBER,
        },
        options: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
      },
      {
        ...options,
        validate: {
          mustHaveValidOptions() {
            if (!this.options) return;
            const parsed = this.options.split(", ").map(x => x.trim()).filter(x => x);
            if (!Array.isArray(parsed)) {
              throw new InvalidOperationError('options must be a valid JSON array');
            }
          },
          mustHaveCategory() {
            if (!this.labTestCategoryId) {
              throw new InvalidOperationError('A lab test must belong to a category');
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'labTestCategoryId',
    });
  }
}
