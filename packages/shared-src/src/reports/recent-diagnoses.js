import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from './utilities';

const reportColumnTemplate = [
  { title: 'Date', accessor: data => data.date },
  { title: 'Diagnosis', accessor: data => data.Diagnosis.name },
  { title: 'Patient First Name', accessor: data => data.Encounter.patient.firstName },
  { title: 'Patient Last Name', accessor: data => data.Encounter.patient.lastName },
  { title: 'Patient ID', accessor: data => data.Encounter.patient.displayId },
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
          case 'village':
            where['$Encounter->patient.village_id$'] = value;
            break;
          case 'practitioner':
            where['$Encounter.examiner_id$'] = value;
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
        include: [
          { model: models.Patient, as: 'patient', include: [{ model: models.ReferenceData }] },
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

export async function generateRecentDiagnosesReport(models, parameters) {
  const queryResults = await queryDiagnosesData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}
