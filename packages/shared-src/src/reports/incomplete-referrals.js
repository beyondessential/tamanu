import { Op } from 'sequelize';
import { generateReportFromQueryData } from './utilities';

const reportColumnTemplate = [
  { title: 'Patient First Name', accessor: data => data.patient.firstName },
  { title: 'Patient Last Name', accessor: data => data.patient.lastName },
  { title: 'National Health Number', accessor: data => data.patient.displayId },
  {
    title: 'Diagnoses',
    accessor: data => {
      if (data.diagnoses && data.diagnoses.length) {
        return data.diagnoses
          .map(d => {
            if (d.Diagnosis && d.Diagnosis.name) {
              return d.Diagnosis.name;
            } else {
              return '';
            }
          })
          .join(', ');
      }

      return undefined;
    },
  },
  { title: 'Referring Doctor', accessor: data => data.referredBy.displayName },
  { title: 'Department', accessor: data => data.referredToDepartment?.name || '' },
  { title: 'Facility', accessor: data => data.referredToFacility?.name || '' },
  { title: 'Date', accessor: data => data.date },
];

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
      {
        model: models.Patient,
        as: 'patient',
        include: [{ model: models.ReferenceData, as: 'village' }],
      },
      { model: models.User, as: 'referredBy' },
      { model: models.ReferenceData, as: 'referredToDepartment' },
      { model: models.ReferenceData, as: 'referredToFacility' },
      {
        model: models.ReferralDiagnosis,
        as: 'diagnoses',
        include: [{ model: models.ReferenceData, as: 'Diagnosis' }],
      },
    ],
    where: parametersToSqlWhere(parameters),
  });
  return result;
}

export async function generateIncompleteReferralsReport(models, parameters) {
  const queryResults = await queryReferralsData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}
