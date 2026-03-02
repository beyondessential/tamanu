import { DataTypes } from 'sequelize';
import { LAB_TEST_RESULT_TYPES, SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

function optionStringToArray(s: string) {
  if (!s) return undefined;
  const trimmed = s.trim();
  if (!trimmed) return undefined;
  return trimmed
    .split(', ')
    .map((x) => x.trim())
    .filter((x) => x);
}

const LAB_TEST_RESULT_TYPES_VALUES = Object.values(LAB_TEST_RESULT_TYPES);

export class LabTestType extends Model {
  declare id: string;
  declare code: string;
  declare name: string;
  declare unit: string;
  declare maleMin?: number;
  declare maleMax?: number;
  declare femaleMin?: number;
  declare femaleMax?: number;
  declare rangeText?: string;
  declare resultType: string;
  declare options?: string;
  declare isSensitive: boolean;
  declare visibilityStatus: string;
  declare externalCode?: string;
  declare labTestCategoryId?: string;
  declare supportsSecondaryResults: boolean;

  static initModel({ primaryKey, ...options }: InitOptions) {
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
          type: DataTypes.ENUM(...LAB_TEST_RESULT_TYPES_VALUES),
          allowNull: false,
          defaultValue: LAB_TEST_RESULT_TYPES.NUMBER,
        },
        options: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        isSensitive: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        supportsSecondaryResults: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
        externalCode: DataTypes.TEXT,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        validate: {
          mustHaveValidOptions() {
            const parsed = optionStringToArray(this.options as string);
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

  static initRelations(models: Models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'labTestCategoryId',
      as: 'category',
    });
    this.hasMany(models.LabTestPanelLabTestTypes, {
      foreignKey: 'labTestTypeId',
      as: 'panelRelations',
    });
    this.belongsToMany(models.LabTestPanel, {
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

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
