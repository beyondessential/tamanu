import { DataTypes, type ModelStatic } from 'sequelize';
import { LAB_TEST_RESULT_TYPES, SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { Model } from './Model';
import { type ModelAttributes } from '../types/sequelize';

function optionStringToArray(s: string | null): string[] | undefined {
  if (!s) return undefined;
  const trimmed = s.trim();
  if (!trimmed) return undefined;
  return trimmed
    .split(', ')
    .map(x => x.trim())
    .filter(x => x);
}

const LAB_TEST_RESULT_TYPE_VALUES = Object.values(LAB_TEST_RESULT_TYPES) as string[];

export class LabTestType extends Model {
  static init({ primaryKey, sequelize, ...options }: ModelAttributes) {
    super.init(
      {
        id: primaryKey,

        code: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: '',
        },
        unit: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: '',
        },
        maleMin: DataTypes.FLOAT,
        maleMax: DataTypes.FLOAT,
        femaleMin: DataTypes.FLOAT,
        femaleMax: DataTypes.FLOAT,
        rangeText: DataTypes.STRING,
        resultType: {
          type: DataTypes.ENUM(...LAB_TEST_RESULT_TYPE_VALUES),
          allowNull: false,
          defaultValue: LAB_TEST_RESULT_TYPES.NUMBER,
        },
        options: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
        externalCode: DataTypes.TEXT,
      },
      {
        ...options,
        primaryKey,
        sequelize,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
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

  static initRelations(this: ModelStatic<LabTestType>, models: { [key: string]: ModelStatic<any> }) {
    this.belongsTo(models.ReferenceData!, {
      foreignKey: 'labTestCategoryId',
      as: 'category',
    });
    this.hasMany(models.LabTestPanelLabTestTypes!, {
      foreignKey: 'labTestTypeId',
      as: 'panelRelations',
    });
    this.belongsToMany(models.LabTestPanel!, {
      through: 'LabTestPanelLabTestTypes',
    });
  }

  forResponse() {
    const { options, ...rest } = super.forResponse();
    return {
      ...rest,
      options: optionStringToArray(options),
    };
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
