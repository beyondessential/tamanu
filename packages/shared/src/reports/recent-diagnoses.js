/* eslint-disable no-param-reassign */

import { Op } from 'sequelize';
import { endOfDay, parseISO, startOfDay, subDays } from 'date-fns';
import { ageInYears, toDateTimeString } from '../utils/dateTime';
import { generateReportFromQueryData } from './utilities';

const reportColumnTemplate = [
  { title: 'Date', accessor: data => data.date },
  { title: 'Diagnosis', accessor: data => data.Diagnosis.name },
  { title: 'Patient First Name', accessor: data => data.encounter.patient.firstName },
  { title: 'Patient Last Name', accessor: data => data.encounter.patient.lastName },
  { title: 'National Health Number', accessor: data => data.encounter.patient.displayId },
  {
    title: 'Age',
    accessor: data => ageInYears(data.encounter.patient.dateOfBirth),
  },
  { title: 'Sex', accessor: data => data.encounter.patient.sex },
  {
    title: 'Contact Number',
    accessor: data => {
      const additionalDetails = JSON.parse(data.encounter.patient.additionalDetails || '{}');
      return additionalDetails.primaryContactNumber || additionalDetails.secondaryContactNumber;
    },
  },
  { title: 'Village', accessor: data => data.encounter.patient.ReferenceDatum.name },
  { title: 'Clinician', accessor: data => data.encounter.examiner?.displayName || '' },
  { title: 'Department', accessor: data => data.encounter.department?.name || '' },
  { title: 'Certainty', accessor: data => data.certainty },
  { title: 'Is Primary', accessor: data => (data.isPrimary ? 'yes' : 'no') },
];

function parametersToSqlWhere(parameters) {
  // eslint-disable-next-line no-param-reassign
  parameters.fromDate = toDateTimeString(
    startOfDay(parameters.fromDate ? parseISO(parameters.fromDate) : subDays(new Date(), 30)),
  );
  parameters.toDate = parameters.toDate && endOfDay(parseISO(parameters.toDate));

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        switch (key) {
          case 'village':
            where['$encounter->patient.village_id$'] = value;
            break;
          case 'practitioner':
            where['$encounter.examiner_id$'] = value;
            break;
          case 'fromDate':
            where.date[Op.gte] = value;
            break;
          case 'toDate':
            where.date[Op.lte] = value;
            break;
          default:
            break;
        }

        // account for multiple diagnosis parameters, ie.
        // diagnosis, diagnosis2, diagnosis3...
        if (/^diagnosis[0-9]*$/.test(key)) {
          where.diagnosisId.push(value);
        }
        return where;
      },
      {
        date: {},
        diagnosisId: [],
      },
    );
  return whereClause;
}

async function queryDiagnosesData(models, parameters) {
  const result = await models.EncounterDiagnosis.findAll({
    include: [
      {
        model: models.Encounter,
        as: 'encounter',
        include: [
          {
            model: models.Patient,
            as: 'patient',
            include: [{ model: models.ReferenceData, as: 'village' }],
          },
          { model: models.User, as: 'examiner' },
          { model: models.Department, as: 'department' },
        ],
      },
      { model: models.ReferenceData, as: 'Diagnosis' },
    ],
    where: parametersToSqlWhere(parameters),
  });
  return result;
}

export async function dataGenerator({ models }, parameters) {
  const queryResults = await queryDiagnosesData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}
