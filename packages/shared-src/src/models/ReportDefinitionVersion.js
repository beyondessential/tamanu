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
        name: yup.string().required(),
      }),
    ),
  dataSources: yup.array(),
});

const generateReportFromQueryData = queryData => {
  if (queryData.length === 0) {
    return [];
  }
  return [Object.keys(queryData[0]), ...queryData.map(col => Object.values(col))];
};

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

  getParameters() {
    const options = JSON.parse(this.queryOptions);
    return options.parameters;
  }

  async dataGenerator(context, parameters) {
    const { sequelize } = context;
    const reportQuery = this.get('query');
    // const reportQuery =
    //   'SELECT\n' +
    //   '"initiatingEncounter"."start_date" AS "Date",\n' +
    //   '"patient"."display_id" AS "National Health Number",\n' +
    //   '"patient"."first_name" AS "Patient First Name",\n' +
    //   '"patient"."last_name" AS "Patient Last Name",\n' +
    //   '"examiner"."display_name" AS "Referring Doctor"\n' +
    //   'FROM "referrals" AS "Referral"\n' +
    //   'LEFT OUTER JOIN "encounters" AS "initiatingEncounter" ON "Referral"."initiating_encounter_id" = "initiatingEncounter"."id"\n' +
    //   'LEFT OUTER JOIN "users" AS "examiner" ON "initiatingEncounter"."examiner_id" = "examiner"."id"\n' +
    //   'LEFT OUTER JOIN "patients" AS "patient" ON "initiatingEncounter"."patient_id" = "patient"."id"\n' +
    //   'LEFT OUTER JOIN "encounter_diagnoses" AS "diagnoses" ON "initiatingEncounter"."id" = "diagnoses"."encounter_id"\n' +
    //   'WHERE examiner.id LIKE :practitioner AND patient.village_id LIKE :village;';

    const parametersDefinition = this.getParameters();
    const parametersDefaults = parametersDefinition.reduce(
      (obj, { name }) => ({ ...obj, [name]: '%' }),
      {},
    );

    const replacements = { ...parametersDefaults, ...parameters };

    console.log('replacements', replacements);

    const queryResults = await sequelize.query(reportQuery, {
      type: QueryTypes.SELECT,
      replacements,
    });

    const forResponse = generateReportFromQueryData(queryResults);
    console.log('For response', forResponse);
    return forResponse;
  }
}
