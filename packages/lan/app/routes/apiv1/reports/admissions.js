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
  const whereClause = Object.entries(parameters).reduce(
    (where, [key, value]) => {
      if (key === 'location') {
        where.locationId = value;
      }
      if (key === 'practitioner') {
        where.examinerId = value;
      }
      if (key === 'fromDate') {
        where.startDate[Op.gte] = value;
      }
      if (key === 'toDate') {
        where.startDate[Op.lte] = value;
      }
      return where;
    },
    {
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: {},
    },
  );

  console.log('where', whereClause);
  return whereClause;
}

async function queryAdmissionsData(models, parameters) {
  if (!parameters.location) {
    return [];
  }
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

  const excelData = await generateAdmissionsReport(models, parameters);
  res.send(excelData);
});
