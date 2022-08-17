import { Sequelize, QueryTypes } from 'sequelize';
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

const generateReportFromQueryData = queryData => [
  Object.keys(queryData[0]),
  ...queryData.map(col => Object.values(col)),
];

export class ReportDefinitionVersion extends Model {
  // Todo: add permission as a column and default to Report
  permission = 'Report';

  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        versionNumber: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        notes: {
          // Justify changes, link to card requesting changes, etc.
          type: Sequelize.STRING,
          allowNull: true,
        },
        status: {
          type: Sequelize.STRING,
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
          type: Sequelize.JSON,
          allowNull: false,
          validate: {
            matchesSchema: value => optionsValidator.validate(value),
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

  async dataGenerator(context, parameters) {
    const { sequelize } = context;
    const reportQuery = this.get('query');
    const queryResults = await sequelize.query(reportQuery, {
      type: QueryTypes.SELECT,
      replacements: parameters,
    });

    const forResponse = generateReportFromQueryData(queryResults);
    console.log('For response', forResponse);
    return forResponse;
  }
}
