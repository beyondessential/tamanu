import { Sequelize } from 'sequelize';
import * as yup from 'yup';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

const columnMappingValidator = yup.array().of(
  yup
    .array()
    .of(yup.string())
    .length(2),
);

const parametersValidator = yup.array().of(
  yup.object({
    parameterField: yup.string().required(),
  }),
);
export class ReportDefinitionVersion extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          // human-readable name
          type: Sequelize.STRING,
          allowNull: false,
        },
        notes: {
          // Justify changes, link to card requesting changes, etc.
          type: Sequelize.STRING,
          allowNull: true,
        },
        state: {
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
        columnMapping: {
          // json pairs that maps SQL output to Excel names, in the form of
          // ```
          // [
          //   ["displayId", "NHN"],
          //   ["someCamelCaseThing", "COVID-19 numbers from Curaçao"]
          // ]
          // ```
          // If null, will do no mapping, just use sql output
          type: Sequelize.TEXT,
          allowNull: true,
          default: '[]',
          validate: {
            matchesSchema: columnMappingValidator.validate,
          },
        },
        parameters: {
          // same as the current parameters, e.g.
          // ```
          // [
          //   { "parameterField": "VillageField" },
          //   { "parameterField": "VaccineCategoryField" },
          //   { "parameterField": "VaccineField" }
          // ]
          // ```
          type: Sequelize.TEXT,
          allowNull: false,
          default: '[]',
          validate: {
            matchesSchema: parametersValidator.validate,
          },
        },
        allFacilities: {
          // Whether this report is available to be run on the lan server.
          type: Sequelize.BOOLEAN,
          allowNull: false,
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

    this.hasMany(models.ReportRequest, {
      foreignKey: 'versionId',
      as: 'runs',
    });
  }
}
