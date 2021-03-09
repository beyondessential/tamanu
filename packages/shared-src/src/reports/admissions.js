import { Op } from 'sequelize';
import moment from 'moment';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { generateReportFromQueryData } from './utilities';

const reportColumnTemplate = [
  { title: 'Patient First Name', accessor: data => data.patient.firstName },
  { title: 'Patient Last Name', accessor: data => data.patient.lastName },
  { title: 'National Health Number', accessor: data => data.patient.displayId },
  { title: 'Sex', accessor: data => data.patient.sex },
  { title: 'Village', accessor: data => data.patient.ReferenceDatum.name },
  { title: 'Doctor/Nurse', accessor: data => data.examiner?.displayName },
  { title: 'Admission Date', accessor: data => data.startDate },
  { title: 'Discharge Date', accessor: data => data.endDate },
];

function parametersToSqlWhere(parameters) {
  if (!parameters.fromDate) {
    parameters.fromDate = moment()
      .subtract(30, 'days')
      .toISOString();
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        switch (key) {
          case 'practitioner':
            where.examinerId = value;
            break;
          case 'fromDate':
            where.startDate[Op.gte] = value;
            break;
          case 'toDate':
            where.startDate[Op.lte] = value;
            break;
          default:
            break;
        }
        return where;
      },
      {
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        startDate: {},
      },
    );

  return whereClause;
}

async function queryAdmissionsData(models, parameters) {
  const result = await models.Encounter.findAll({
    include: [
      {
        model: models.Patient,
        as: 'patient',
        include: [{ model: models.ReferenceData, as: 'village' }],
      },
      { model: models.User, as: 'examiner' },
      { model: models.ReferenceData, as: 'location' },
      { model: models.ReferenceData, as: 'department' },
    ],
    where: parametersToSqlWhere(parameters),
  });
  return result;
}

export async function generateAdmissionsReport(models, parameters) {
  const queryResults = await queryAdmissionsData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}
