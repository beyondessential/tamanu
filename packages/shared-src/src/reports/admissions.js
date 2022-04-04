import { Op } from 'sequelize';
import { subDays, format } from 'date-fns';
import { ENCOUNTER_TYPES, DIAGNOSIS_CERTAINTY } from 'shared/constants';
import { inspect } from 'util';
import { generateReportFromQueryData } from './utilities';

const reportColumnTemplate = [
  { title: 'Patient First Name', accessor: data => data.patient.firstName },
  { title: 'Patient Last Name', accessor: data => data.patient.lastName },
  { title: 'Patient ID', accessor: data => data.patient.displayId },
  { title: 'Date of Birth', accessor: data => format(data.patient.dateOfBirth, 'dd/MM/yyyy') },
  { title: 'Location', accessor: data => data.location.name },
  { title: 'Department', accessor: data => data.department.name },
  { title: 'Primary diagnoses', accessor: data => data.primaryDiagnoses },
  { title: 'Secondary diagnoses', accessor: data => data.secondaryDiagnoses },
  { title: 'Sex', accessor: data => data.patient.sex },
  { title: 'Village', accessor: data => data.patient.village.name },
  { title: 'Doctor/Nurse', accessor: data => data.examiner?.displayName },
  { title: 'Admission Date', accessor: data => format(data.startDate, 'dd/MM/yyyy') },
  { title: 'Discharge Date', accessor: data => format(data.endDate, 'dd/MM/yyyy') },
];

function parametersToSqlWhere(parameters) {
  const {
    fromDate = subDays(new Date(), 30).toISOString(),
    toDate,
    practitioner,
    location,
    department,
  } = parameters;

  return {
    encounterType: ENCOUNTER_TYPES.ADMISSION,
    ...(practitioner && { examinerId: practitioner }),
    ...(department && { departmentId: department }),
    ...(location && { locationId: location }),
    startDate: {
      [Op.gte]: fromDate,
      ...(toDate && { [Op.lte]: toDate }),
    },
  };
}

const stringifyDiagnoses = (diagnoses, shouldBePrimary) =>
  diagnoses
    .filter(({ isPrimary }) => isPrimary === shouldBePrimary)
    .map(({ Diagnosis }) => `${Diagnosis.code} ${Diagnosis.name}`)
    .join('; ');

async function queryAdmissionsData(models, parameters) {
  const results = await models.Encounter.findAll({
    include: [
      {
        model: models.Patient,
        as: 'patient',
        include: ['village'],
      },
      'examiner',
      'location',
      'department',
      {
        model: models.EncounterDiagnosis,
        as: 'diagnoses',
        required: false,
        where: {
          certainty: DIAGNOSIS_CERTAINTY.CONFIRMED,
        },
        include: ['Diagnosis'],
      },
    ],
    where: parametersToSqlWhere(parameters),
  });

  console.log(inspect(results));
  return results.map(result => ({
    ...result,
    primaryDiagnoses: stringifyDiagnoses(result.diagnoses, true),
    secondaryDiagnoses: stringifyDiagnoses(result.diagnoses, false),
  }));
}

export async function dataGenerator({ models }, parameters) {
  const queryResults = await queryAdmissionsData(models, parameters);
  console.log(queryResults);
  console.log(queryResults.startDate);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}

export const permission = 'Encounter';
