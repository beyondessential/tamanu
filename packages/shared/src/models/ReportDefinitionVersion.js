import { Sequelize, QueryTypes } from 'sequelize';
import * as yup from 'yup';
import {
  SYNC_DIRECTIONS,
  REPORT_STATUSES,
  REPORT_STATUSES_VALUES,
  REPORT_DEFAULT_DATE_RANGES_VALUES,
} from '../constants';
import { Model } from './Model';
import { getReportQueryReplacements } from '../utils/reports/getReportQueryReplacements';

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
  dateRangeLabel: yup.string(),
  defaultDateRange: yup
    .string()
    .oneOf(REPORT_DEFAULT_DATE_RANGES_VALUES)
    .required(),
});

const generateReportFromQueryData = queryData => {
  if (queryData.length === 0) {
    return [];
  }
  return [Object.keys(queryData[0]), ...queryData.map(Object.values)];
};

export class ReportDefinitionVersion extends Model {
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
           * See optionsValidator for exact schema
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
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
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

  getQueryOptions() {
    // Make sure that query options is being returned as an object. It seems to come back sometimes
    // as a string and sometimes as an object otherwise.
    return typeof this.queryOptions === 'string'
      ? JSON.parse(this.queryOptions)
      : this.queryOptions;
  }

  getParameters() {
    const options = this.getQueryOptions();
    return options.parameters;
  }

  async dataGenerator(context, parameters) {
    const { sequelize } = context;
    const reportQuery = this.get('query');

    const queryOptions = this.getQueryOptions();

    const replacements = await getReportQueryReplacements(
      context,
      queryOptions.parameters,
      parameters,
      queryOptions.defaultDateRange,
    );

    const queryResults = await sequelize.query(reportQuery, {
      type: QueryTypes.SELECT,
      replacements,
    });
    return generateReportFromQueryData(queryResults);
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
