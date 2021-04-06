import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from './utilities';
import { differenceInYears } from 'date-fns';

const reportColumnTemplate = [
  { title: 'Date', accessor: data => data.date },
  { title: 'Diagnosis', accessor: data => data.Diagnosis.name },
  { title: 'Patient First Name', accessor: data => data.Encounter.patient.firstName },
  { title: 'Patient Last Name', accessor: data => data.Encounter.patient.lastName },
  { title: 'National Health Number', accessor: data => data.Encounter.patient.displayId },
  { title: 'Sex', accessor: data => data.Encounter.patient.sex },
  { title: 'Village', accessor: data => data.Encounter.patient.ReferenceDatum.name },
  { title: 'Doctor/Nurse', accessor: data => data.Encounter.examiner?.displayName || '' },
  { title: 'Department', accessor: data => data.Encounter.department?.name || '' },
  { title: 'Certainty', accessor: data => data.certainty },
  { title: 'Is Primary', accessor: data => (data.isPrimary ? 'yes' : 'no') },
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
        include: [
          {
            model: models.Patient,
            as: 'patient',
            include: [{ model: models.ReferenceData, as: 'ethnicity' }],
          },
          { model: models.User, as: 'examiner' },
          { model: models.ReferenceData, as: 'department' },
        ],
      },
      { model: models.ReferenceData, as: 'Diagnosis' },
    ],
    where: parametersToSqlWhere(parameters),
  });
  return result;
}

export async function dataGenerator(models, parameters) {
  const queryResults = await queryDiagnosesData(models, parameters);
  const today = new Date();
  // return queryResults;
  const dataForExcel = queryResults
    .map(r => {
      const plain = r.get({ plain: true });
      return {
        certainty: plain.certainty,
        isPrimary: plain.isPrimary,
        date: plain.date,
        name: plain.Diagnosis.name,
        patient: plain.Encounter.patient.firstName,
        patientGender:
          plain.Encounter.patient.sex === 'male' || plain.Encounter.patient.sex === 'female'
            ? plain.Encounter.patient.sex
            : 'Other',
        patientAge: differenceInYears(today, plain.Encounter.patient.dateOfBirth),
        patientEthnicity: plain.Encounter.patient.ethnicity?.name || '',
        patientId: plain.Encounter.patientId,
      };
    })
    .reduce(
      function(acc, diagnosis) {
        acc.dynamicColumns[diagnosis.name] = 1;

        // Gender rows
        acc.rows.Gender[diagnosis.patientGender].all[diagnosis.patientId] = 1;
        if (!acc.rows.Gender[diagnosis.patientGender][diagnosis.name]) {
          acc.rows.Gender[diagnosis.patientGender][diagnosis.name] = {};
        }
        acc.rows.Gender[diagnosis.patientGender][diagnosis.name][diagnosis.patientId] = 1;

        // Age rows
        if (diagnosis.patientAge < 30) {
          acc.rows.Age['<30'].all[diagnosis.patientId] = 1;
          if (!acc.rows.Age['<30'][diagnosis.name]) {
            acc.rows.Age['<30'][diagnosis.name] = {};
          }
          acc.rows.Age['<30'][diagnosis.name][diagnosis.patientId] = 1;
        } else {
          acc.rows.Age['30+'].all[diagnosis.patientId] = 1;
          if (!acc.rows.Age['30+'][diagnosis.name]) {
            acc.rows.Age['30+'][diagnosis.name] = {};
          }
          acc.rows.Age['30+'][diagnosis.name][diagnosis.patientId] = 1;
        }

        // Ethnicity age
        if (!acc.rows.Ethnicity[diagnosis.patientEthnicity]) {
          acc.rows.Ethnicity[diagnosis.patientEthnicity] = { all: {} };
        }
        acc.rows.Ethnicity[diagnosis.patientEthnicity].all[diagnosis.patientId] = 1;
        if (!acc.rows.Ethnicity[diagnosis.patientEthnicity][diagnosis.name]) {
          acc.rows.Ethnicity[diagnosis.patientEthnicity][diagnosis.name] = {};
        }
        acc.rows.Ethnicity[diagnosis.patientEthnicity][diagnosis.name][diagnosis.patientId] = 1;

        return acc;
      },
      {
        dynamicColumns: {},
        rows: {
          Gender: { male: { all: {} }, female: { all: {} }, other: { all: {} } },
          Age: { '<30': { all: {} }, '30+': { all: {} } },
          Ethnicity: {},
          Total: { all: {} },
        },
      },
    );
  const excelData = [
    '',
    '',
    'Number attended',
    ...Object.keys(dataForExcel.dynamicColumns).map(
      diagnosisName => `Number by ${diagnosisName}`,
    ),
  ];
  // excelData.concat(Object.entries(dataForExcel.rows.Gender).map(([key, {all, ...dianoses}], index)=> {
  //   const firstColumn = index === 0 ? 'Gender' : '';
  //   return [firstColumn, key, Object.keys(all).length + 1, ...Object.entries(diagnoses).map()]
  // }));
  return [excelData, dataForExcel];
  // return generateReportFromQueryData(queryResults, reportColumnTemplate);
}

export const permission = 'EncounterDiagnosis';
