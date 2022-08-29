import { Sequelize, QueryTypes } from 'sequelize';
import * as yup from 'yup';
import { SYNC_DIRECTIONS, REPORT_STATUSES, REPORT_STATUSES_VALUES } from 'shared/constants';
import { Model } from './Model';
import { getQueryReplacementsFromParams } from '../utils/getQueryReplacementsFromParams';

const optionsValidator = yup.object({
  parameters: yup
    .array()
    .required()
    .of(
      yup.object({
        parameterField: yup.string().required(),
        name: yup.string().required(),
      }),
    ),
  dataSources: yup.array(),
});

const generateReportFromQueryData = queryData => {
  if (queryData.length === 0) {
    return [];
  }
  return [Object.keys(queryData[0]), ...queryData.map(Object.values)];
};

export class ReportDefinitionVersion extends Model {
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
      foreignKey: 'reportDefinitionId',
      as: 'reportDefinition',
    });

    this.belongsTo(models.User, {
      foreignKey: { name: 'userId', allowNull: false },
    });

    this.hasMany(models.ReportRequest);
  }

  getParameters() {
    const options = JSON.parse(this.queryOptions);
    return options.parameters;
  }

  async dataGenerator(context, parameters) {
    const { sequelize } = context;
    const reportQuery = this.get('query');

    const parametersDefinition = this.getParameters();
    const replacements = getQueryReplacementsFromParams(parametersDefinition, parameters);

    const queryResults = await sequelize.query(reportQuery, {
      type: QueryTypes.SELECT,
      replacements,
    });

    return generateReportFromQueryData(queryResults);
  }
}
