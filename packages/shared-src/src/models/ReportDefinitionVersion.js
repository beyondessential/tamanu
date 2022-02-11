// import { Sequelize } from 'sequelize';
// import * as yup from 'yup';
// import { SYNC_DIRECTIONS } from 'shared/constants';
// import { Model } from './Model';

// export class ReportDefinitionVersion extends Model {
//   static init({ primaryKey, ...options }) {
//     super.init(
//       {
//         id: primaryKey,
//         name: {
//           // human-readable name
//           type: Sequelize.STRING,
//           allowNull: false,
//         },
//         state: {
//           type: Sequelize.STRING,
//           allowNull: false,
//           default: 'draft',
//           validate: {
//             isIn: [['draft', 'published']],
//           },
//         },
//         query: {
//           // SQL query
//           type: Sequelize.TEXT,
//           allowNull: false,
//         },
//         columnMapping: {
//           // json pairs that maps SQL output to Excel names, in the form of
//           // ```
//           // [
//           //   ["displayId", "NHN"],
//           //   ["someCamelCaseThing", "COVID-19 numbers from Curaçao"]
//           // ]
//           // ```
//           // If null, will do no mapping, just use sql output
//           type: Sequelize.TEXT,
//           allowNull: true,
//           default: '[]',
//           validate: {
//             matchesSchema(value) {
//               yup.array().of(
//                 yup.array().of(yup.string()).length(2)
//               ).validate(value);
//             },
//           }
//         },
//         parameters: {
//           // same as the current parameters, e.g.
//           // ```
//           // [
//           //   { "parameterField": "VillageField" },
//           //   { "parameterField": "VaccineCategoryField" },
//           //   { "parameterField": "VaccineField" }
//           // ]
//           // ```
//           type: Sequelize.TEXT,
//           allowNull: false,
//           default: '[]',
//           validate: {
//             async matchesSchema(value) {
//               // yup schema
//             },
//           }
//         },        
//       },
//       {
//         ...options,
//         syncConfig: { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
//       },
//     );
//   }

//   static initRelations(models) {
//     this.belongsTo(models.ReportDefinition, {
//       foreignKey: 'definitionId',
//       as: 'definition',
//     });

//     this.hasMany(models.ReportRequest, {
//       foreignKey: 'versionId',
//       as: 'runs',
//     });
//   }
