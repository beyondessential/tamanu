import { Sequelize } from 'sequelize';
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
            if(!this.options) return;
            const parsed = JSON.parse(this.options);
            if(!Array.isArray(parsed)) {
              throw new InvalidOperationError("options must be a valid JSON array");
            }
          },
          mustHaveCategory() {
            if(!this.labTestCategoryId) {
              throw new InvalidOperationError("A lab test must belong to a category");
            }
          },
        }
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'labTestCategoryId',
    });
  }
}
