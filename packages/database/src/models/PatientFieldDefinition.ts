import { DataTypes } from 'sequelize';
import {
  PATIENT_FIELD_DEFINITION_TYPE_VALUES,
  SYNC_DIRECTIONS,
  VISIBILITY_STATUS_VALUES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

const FIELD_TYPE_ERR_MSG = `fieldType must be one of ${JSON.stringify(
  PATIENT_FIELD_DEFINITION_TYPE_VALUES,
)}`;
const VISIBILITY_STATUS_ERR_MSG = `state must be one of ${JSON.stringify(VISIBILITY_STATUSES)}`;

export class PatientFieldDefinition extends Model {
  id!: string;
  name!: string;
  fieldType!: string;
  options?: string[];
  visibilityStatus!: string;
  categoryId?: string;
  definitionId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        fieldType: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isIn: {
              args: [PATIENT_FIELD_DEFINITION_TYPE_VALUES],
              msg: FIELD_TYPE_ERR_MSG,
            },
          },
        },
        options: DataTypes.ARRAY(DataTypes.STRING),
        visibilityStatus: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
          validate: {
            isIn: {
              args: [VISIBILITY_STATUS_VALUES],
              msg: VISIBILITY_STATUS_ERR_MSG,
            },
          },
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.PatientFieldDefinitionCategory, {
      foreignKey: 'categoryId',
      as: 'category',
    });

    this.hasMany(models.PatientFieldValue, {
      foreignKey: 'definitionId',
      as: 'values',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
