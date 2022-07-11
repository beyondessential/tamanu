import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { SYNC_DIRECTIONS, LAB_RESULT_QUESTION_TYPES } from 'shared/constants';
import { Model } from './Model';

const QUESTION_TYPE_VALUES = Object.values(LAB_RESULT_QUESTION_TYPES);

function optionStringToArray(s) {
  if (!s) return undefined;
  const trimmed = s.trim();
  if (!trimmed) return undefined;
  return trimmed
    .split(', ')
    .map(x => x.trim())
    .filter(x => x);
}

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
          defaultValue: LAB_RESULT_QUESTION_TYPES.NUMBER,
        },
        options: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PULL_ONLY },
        validate: {
          mustHaveValidOptions() {
            const parsed = optionStringToArray(this.options);
            if (!parsed) return;
            if (!Array.isArray(parsed)) {
              throw new InvalidOperationError('Options must be a comma-separated array');
            }
          },
          mustHaveCategory() {
            if (!this.deletedAt && !this.labTestCategoryId) {
              throw new InvalidOperationError('A lab test type must belong to a category');
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

  forResponse() {
    const { options, ...rest } = super.forResponse();
    return {
      ...rest,
      options: optionStringToArray(options),
    };
  }
}
