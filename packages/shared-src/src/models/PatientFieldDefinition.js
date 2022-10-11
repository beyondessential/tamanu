import { Sequelize } from 'sequelize';
import {
  PATIENT_FIELD_DEFINITION_TYPE_VALUES,
  PATIENT_FIELD_DEFINITION_STATES,
  PATIENT_FIELD_DEFINITION_STATE_VALUES,
} from 'shared/constants';
import { Model } from './Model';

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
            isIn: [PATIENT_FIELD_DEFINITION_TYPE_VALUES],
          },
        },
        options: Sequelize.ARRAY(Sequelize.STRING),
        state: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: PATIENT_FIELD_DEFINITION_STATES.CURRENT,
          validate: {
            isIn: [PATIENT_FIELD_DEFINITION_STATE_VALUES],
          },
        },
      },
      {
        ...options,
        syncConfig: {
          // TODO
        },
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
