import { Sequelize } from 'sequelize';
import {
  PATIENT_FIELD_DEFINITION_TYPE_VALUES,
  PATIENT_FIELD_DEFINITION_STATES,
  PATIENT_FIELD_DEFINITION_STATE_VALUES,
  SYNC_DIRECTIONS,
} from 'shared/constants';
import { Model } from './Model';

const FIELD_TYPE_ERR_MSG = `fieldType must be one of ${JSON.stringify(
  PATIENT_FIELD_DEFINITION_TYPE_VALUES,
)}`;
const STATE_ERR_MSG = `state must be one of ${JSON.stringify(
  PATIENT_FIELD_DEFINITION_STATE_VALUES,
)}`;

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
        state: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: PATIENT_FIELD_DEFINITION_STATES.CURRENT,
          validate: {
            isIn: {
              args: [PATIENT_FIELD_DEFINITION_STATE_VALUES],
              msg: STATE_ERR_MSG,
            },
          },
        },
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PULL_ONLY },
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

  static async createOrUpdateValues(patientId, patientFields = {}) {
    const { PatientFieldValue } = this.sequelize.models;
    for (const [definitionId, value] of Object.entries(patientFields)) {
      // race condition doesn't matter because we take the last value anyway
      const field = await PatientFieldValue.findOne({
        where: {
          definitionId,
          patientId,
        },
        order: [['updatedAt', 'DESC']],
      });
      if (field) {
        await field.update({ value });
      } else {
        await PatientFieldValue.create({ value, definitionId, patientId });
      }
    }
  }
}
