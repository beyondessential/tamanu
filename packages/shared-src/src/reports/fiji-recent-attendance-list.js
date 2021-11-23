import { keyBy, groupBy } from 'lodash';
import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from './utilities';
import { LAB_REQUEST_STATUS_LABELS } from '../constants';
import { transformAnswers } from './utilities/transformAnswers';

const reportColumnTemplate = [
  {
    title: 'First name',
    accessor: data => data.firstName,
  },
  {
    title: 'Last name',
    accessor: data => data.lastName,
  },
  {
    title: 'NHN',
    accessor: data => data.displayId,
  },
  { title: 'Age', accessor: data => data.age },
  { title: 'Gender', accessor: data => data.sex },
  { title: 'Ethnicity', accessor: data => data.ethnicity },
  { title: 'Contact number', accessor: data => data.contactPhone },
  { title: 'Clinician', accessor: data => data.clinician },
  { title: 'Date of attendance', accessor: data => data.dateOfAttendance },
  { title: 'Department', accessor: data => data.department },
  { title: 'Location', accessor: data => data.location },
  { title: 'Reason for attendance', accessor: data => data.reasonForAttendance },
  { title: 'Diagnosis', accessor: data => data.diagnosis },
  { title: 'Diagnosis certainty', accessor: data => data.diagnosisCertainty },
];

const parametersToEncounterSqlWhere = parameters => {
  return Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      const newWhere = { ...where };
      switch (key) {
        case 'diagnosis':
          newWhere['$encounter.diagnosisId$'] = value;
          break;
        case 'fromDate':
          if (!where.date) {
            where.date = {};
          }
          where.date[Op.gte] = value;
          break;
        case 'toDate':
          if (!where.date) {
            where.date = {};
          }
          where.date[Op.lte] = value;
          break;
        default:
          break;
      }
      return newWhere;
    }, {});
};

const getEncounters = async (models, parameters) => {
  return models.Encounter.findAll({
    include: [
      {
        model: models.LabRequest,
        as: 'labRequest',
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
            ],
          },
          { model: models.ReferenceData, as: 'category' },
          { model: models.ReferenceData, as: 'priority' },
          { model: models.ReferenceData, as: 'laboratory' },
          { model: models.User, as: 'requestedBy' },
        ],
      },
      {
        model: models.LabTestType,
        as: 'labTestType',
      },
    ],
    where: parametersToEncounterSqlWhere(parameters),
    order: [['date', 'ASC']],
  });
};

export const dataGenerator = async (models, parameters = {}) => {
  const encounters = await getEncounters(models, parameters);

  const reportData = [...encounters];
  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'LabTest';
