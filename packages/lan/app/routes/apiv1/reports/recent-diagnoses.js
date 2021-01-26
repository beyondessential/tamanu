import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import moment from 'moment';

const admissionsHeaderRow = [
  'Date',
  'Diagnosis',
  'Patient First Name',
  'Patient Last Name',
  'Patient ID',
  'Sex',
  'Village',
  'Doctor/Nurse',
  'Department',
  'Certainty',
  'Is Primary',
];

function mapDiagnosisDataRowToExcelRow(data) {
  return [
    data.date,
    data.Diagnosis.name,
    data.Encounter.patient.firstName,
    data.Encounter.patient.lastName,
    data.Encounter.patientId,
    data.Encounter.patient.sex,
    data.Encounter.patient.ReferenceDatum.name,
    data.Encounter.examiner.displayName,
    data.Encounter.department.name,
    data.certainty,
    data.isPrimary ? 'yes' : 'no',
  ];
}

async function generateRecentDiagnosesReport(models, parameters) {
  const queryResults = await queryDiagnosesData(models, parameters);
  return [admissionsHeaderRow, ...queryResults.map(mapDiagnosisDataRowToExcelRow)];
}

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
          case 'diagnoses':
            where.diagnosisId = value;
            break;
          case 'village':
            where['$Encounter->patient.village_id$'] = value;
            break;
          case 'practitioner':
            where['$Encounter.examiner_id$'] = value;
            break;
          case 'location':
            where ['$Encounter.location_id$'] = value;
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
        return where;
      },
      {
        date: {},
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

export const createRecentDiagnosesReport = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'EncounterDiagnosis');
  const {
    models,
    body: { parameters },
  } = req;

  if (!parameters.diagnoses) {
    res.status(400).send(`'diagnoses' parameter is required`);
    return;
  }
  const excelData = await generateRecentDiagnosesReport(models, parameters);
  res.send(excelData);
});
