import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

const referralsHeaderRow = [
  'Patient First Name',
  'Patient Last Name',
  'Patient ID',
  'Diagnosis',
  'Referring Doctor',
  'Department',
  'Facility',
  'Date',
];

function mapDiagnosisDataRowToExcelRow(data) {
  return [
    data.patient.firstName,
    data.patient.lastName,
    data.patient.displayId,
    undefined,
    data.referredBy.displayName,
    data.referredToDepartment.name,
    data.referredToFacility.name,
    data.date,
  ];
}

async function generateIncompleteReferralsReport(models, parameters) {
  const queryResults = await queryReferralsData(models, parameters);
  return [referralsHeaderRow, ...queryResults.map(mapDiagnosisDataRowToExcelRow)];
}

function parametersToSqlWhere(parameters) {
  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        switch (key) {
          case 'village':
            where['$patient.village_id$'] = value;
            break;
          case 'practitioner':
            where.referredById = value;
            break;
          case 'fromDate': {
            if (!where.date) {
              where.date = {};
            }
            where.date[Op.gte] = value;
            break;
          }
          case 'toDate': {
            if (!where.date) {
              where.date = {};
            }
            where.date[Op.lte] = value;
            break;
          }
          default:
            break;
        }
        return where;
      },
      {
        encounterId: {
          [Op.is]: null,
        },
      },
    );
  return whereClause;
}

async function queryReferralsData(models, parameters) {
  const result = await models.Referral.findAll({
    include: [
      { model: models.Patient, as: 'patient', include: [{ model: models.ReferenceData }] },
      { model: models.User, as: 'referredBy' },
      { model: models.ReferenceData, as: 'referredToDepartment' },
      { model: models.ReferenceData, as: 'referredToFacility' },
    ],
    where: parametersToSqlWhere(parameters),
  });
  return result;
}

export const createIncompleteReferralsReport = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'Referral');
  const {
    models,
    body: { parameters },
  } = req;

  const excelData = await generateIncompleteReferralsReport(models, parameters);
  res.send(excelData);
});
