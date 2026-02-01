import { QueryTypes, DataTypes, Sequelize } from 'sequelize';
import * as yup from 'yup';
import {
  REPORT_DEFAULT_DATE_RANGES_VALUES,
  REPORT_STATUSES,
  REPORT_STATUSES_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { getReportQueryReplacements } from '@tamanu/shared/utils/reports/getReportQueryReplacements';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

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
  defaultDateRange: yup.string().oneOf(REPORT_DEFAULT_DATE_RANGES_VALUES).required(),
  dhis2DataSet: yup.string(),
});

const generateReportFromQueryData = (queryData: any[]) => {
  if (queryData.length === 0) {
    return [];
  }
  return [Object.keys(queryData[0]), ...queryData.map(Object.values)];
};

export class ReportDefinitionVersion extends Model {
  declare id: string;
  declare versionNumber: number;
  declare notes?: string;
  declare status: string;
  declare query: string;
  declare queryOptions: Record<string, any>;
  declare reportDefinitionId?: string;
  declare userId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        versionNumber: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        notes: {
          // Justify changes, link to card requesting changes, etc.
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: REPORT_STATUSES.DRAFT,
          validate: {
            isIn: [REPORT_STATUSES_VALUES],
          },
        },
        query: {
          // SQL query
          type: DataTypes.TEXT,
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
           *   "dhis2DataSet": "optional-data-set-id-for-dhis2-integration"
           * }
           */
          type: DataTypes.JSON,
          allowNull: false,
          validate: {
            matchesSchema: (value: Record<string, any>) => optionsValidator.validate(value),
          },
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ReportDefinition, {
      foreignKey: 'reportDefinitionId',
      as: 'reportDefinition',
    });

    this.belongsTo(models.User, {
      foreignKey: { name: 'userId', allowNull: false },
      as: 'createdBy',
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

  async dataGenerator(
    {
      sequelize,
      reportSchemaStores,
      facilityId,
    }: { sequelize: Sequelize; reportSchemaStores: any; facilityId: string },
    parameters: any,
  ) {
    const reportQuery = this.get('query');

    const queryOptions = this.getQueryOptions();

    const replacements = await getReportQueryReplacements(
      queryOptions.parameters,
      facilityId,
      parameters,
      queryOptions.defaultDateRange,
    );

    const definition = await (this as any).getReportDefinition();

    const instance = reportSchemaStores
      ? reportSchemaStores[definition.dbSchema]?.sequelize
      : sequelize;
    if (!instance) {
      throw new Error(`No reporting instance found for ${definition.dbSchema}`);
    }
    const queryResults = await instance.query(reportQuery, {
      type: QueryTypes.SELECT,
      replacements,
    });
    return generateReportFromQueryData(queryResults);
  }

  forResponse(includeRelationIds = false) {
    const { reportDefinitionId, userId, ...rest } = this.get();
    delete rest.updatedAtSyncTick;
    delete rest.ReportDefinitionId;

    return {
      ...rest,
      ...(includeRelationIds && {
        reportDefinitionId,
        userId,
      }),
    };
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
