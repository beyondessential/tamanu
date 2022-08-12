import { Sequelize } from 'sequelize';
import * as yup from 'yup';
import { SYNC_DIRECTIONS, REPORT_STATUSES, REPORT_STATUSES_VALUES } from 'shared/constants';
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
  dataSources: yup.array(),
});

export class ReportDefinitionVersion extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        versionNumber: {
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
          default: REPORT_STATUSES.DRAFT,
          validate: {
            isIn: [REPORT_STATUSES_VALUES],
          },
        },
        query: {
          // SQL query
          type: Sequelize.TEXT,
          allowNull: false,
        },
        queryOptions: {
          /**
           * As of 28/02/22, contains:
           *  - parameters
           *  - dataSources
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
           *   "dataSources": [],
           * }
           */
          type: Sequelize.Text,
          allowNull: false,
          default: '{}',
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
      as: 'requests',
    });
  }
}
