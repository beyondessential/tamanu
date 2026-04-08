import { DataTypes } from 'sequelize';
import {
  PATIENT_FIELD_SOURCE_VALUES,
  PATIENT_FIELD_SECTION_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class PatientFieldLayout extends Model {
  declare id: string;
  declare fieldSource: string;
  declare fieldKey?: string;
  declare definitionId?: string;
  declare section?: string;
  declare categoryId?: string;
  declare sortOrder: number;
  declare canHide: boolean;
  declare canDelete: boolean;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        fieldSource: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            isIn: {
              args: [PATIENT_FIELD_SOURCE_VALUES],
              msg: `fieldSource must be one of ${JSON.stringify(PATIENT_FIELD_SOURCE_VALUES)}`,
            },
          },
        },
        fieldKey: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        definitionId: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        section: {
          type: DataTypes.TEXT,
          allowNull: true,
          validate: {
            isIn: {
              args: [PATIENT_FIELD_SECTION_VALUES],
              msg: `section must be one of ${JSON.stringify(PATIENT_FIELD_SECTION_VALUES)}`,
            },
          },
        },
        categoryId: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        sortOrder: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        canHide: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        canDelete: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.PatientFieldDefinition, {
      foreignKey: 'definitionId',
      as: 'definition',
    });

    this.belongsTo(models.PatientFieldDefinitionCategory, {
      foreignKey: 'categoryId',
      as: 'category',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
