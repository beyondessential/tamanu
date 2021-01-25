import express from 'express';
import asyncHandler from 'express-async-handler';

export const report = express.Router();

const AVAILABLE_REPORT_TYPES = {
  admissions: generateAdmissionsReport,
};

async function generateAdmissionsReport(models, parameters) {
  const queryResults = await queryAdmissionsData(models, parameters);
  return [admissionsHeaderRow, ...queryResults.map(mapAdmissionsDataRowToExcelRow)];
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
    where: {
      locationId: parameters.location,
    },
  });
  return result;
}

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

report.post(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Report');
    const {
      models,
      body: { reportType, parameters },
    } = req;
    const reportHandler = AVAILABLE_REPORT_TYPES[reportType];
    if (!reportHandler) {
      res.status(400).end();
    } else {
      const excelData = await reportHandler(models, parameters);
      res.send(excelData);
    }
  }),
);
