import { Sequelize } from 'sequelize';
import {
  PATIENT_FIELD_DEFINITION_TYPE_VALUES,
  VISIBILITY_STATUSES,
  VISIBILITY_STATUS_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { Model } from './Model';

const FIELD_TYPE_ERR_MSG = `fieldType must be one of ${JSON.stringify(
  PATIENT_FIELD_DEFINITION_TYPE_VALUES,
)}`;
const VISIBILITY_STATUS_ERR_MSG = `state must be one of ${JSON.stringify(VISIBILITY_STATUSES)}`;

export class PatientFieldDefinition extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        fieldType: {
          type: Sequelize.STRING,
          allowNull: false,
          validate: {
            isIn: {
              args: [PATIENT_FIELD_DEFINITION_TYPE_VALUES],
              msg: FIELD_TYPE_ERR_MSG,
            },
          },
        },
        options: Sequelize.ARRAY(Sequelize.STRING),
        visibilityStatus: {
          type: Sequelize.STRING,
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

  static initRelations(models) {
    this.belongsTo(models.PatientFieldDefinitionCategory, {
      foreignKey: 'categoryId',
      as: 'category',
    });

    this.hasMany(models.PatientFieldValue, {
      foreignKey: 'definitionId',
      as: 'values',
    });
  }
}
