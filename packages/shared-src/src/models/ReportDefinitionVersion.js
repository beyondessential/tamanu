import { Sequelize } from 'sequelize';
import * as yup from 'yup';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

const optionsValidator = yup.object({
  parameters: yup
    .array()
    .required()
    .of(
      yup.object({
        parameterField: yup.string().required(),
      }),
    ),
  allFacilities: yup.boolean().required(),
});

export class ReportDefinitionVersion extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        notes: {
          // Justify changes, link to card requesting changes, etc.
          type: Sequelize.STRING,
          allowNull: true,
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          default: 'draft',
          validate: {
            isIn: [['draft', 'published']],
          },
        },
        query: {
          // SQL query
          type: Sequelize.TEXT,
          allowNull: false,
        },
        options: {
          /**
           * As of 28/02/22, contains:
           *  - parameters
           *  - allFacilities
           * e.g.
           * {
           *   "parameters": [
           *     { "parameterField": "VillageField" },
           *     {
           *       "parameterField": "ParameterAutocompleteField",
           *       "label": "Nursing Zone",
           *       "name": "nursingZone",
           *       "suggesterEndpoint": "nursingZone"
           *     }
           *   ],
           *   "allFacilities": false,
           * }
           */
          type: Sequelize.TEXT,
          allowNull: false,
          default: '[]',
          validate: {
            matchesSchema: optionsValidator.validate,
          },
        },
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ReportDefinition, {
      foreignKey: 'definitionId',
      as: 'definition',
    });

    this.belongsTo(models.User, {
      foreignKey: { name: 'userId', allowNull: false },
    });

    this.hasMany(models.ReportRequest, {
      foreignKey: 'versionId',
      as: 'runs',
    });
  }
}
