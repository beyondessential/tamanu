import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import moment from 'moment';
import { ENCOUNTER_TYPES } from 'shared/constants';

const admissionsHeaderRow = [
  'Patient First Name',
  'Patient Last Name',
  'Patient ID',
  'Sex',
  'Village',
  'Doctor/Nurse',
  'Admission Date',
  'Discharge Date',
];

function mapAdmissionsDataRowToExcelRow(data) {
  return [
    data.patient.firstName,
    data.patient.lastName,
    data.patientId,
    data.patient.sex,
    data.patient.ReferenceDatum.name,
    data.examiner.displayName,
    data.startDate,
    data.endDate,
  ];
}

async function generateAdmissionsReport(models, parameters) {
  const queryResults = await queryAdmissionsData(models, parameters);
  return [admissionsHeaderRow, ...queryResults.map(mapAdmissionsDataRowToExcelRow)];
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
          case 'location':
            where.locationId = value;
            break;
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
      { model: models.Patient, as: 'patient', include: [{ model: models.ReferenceData }] },
      { model: models.User, as: 'examiner' },
      { model: models.ReferenceData, as: 'location' },
      { model: models.ReferenceData, as: 'department' },
    ],
    where: parametersToSqlWhere(parameters),
  });
  return result;
}

export const createAdmissionsReport = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'Encounter');
  const {
    models,
    body: { parameters },
  } = req;
  if (!parameters.location) {
    res.status(400).send(`'location' parameter is required`);
    return;
  }
  const excelData = await generateAdmissionsReport(models, parameters);
  res.send(excelData);
});
