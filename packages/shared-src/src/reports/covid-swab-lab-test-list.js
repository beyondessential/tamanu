import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from './utilities';
import { LAB_REQUEST_STATUS_LABELS } from '../constants';
const parametersToSqlWhere = parameters => {
  const defaultWhereClause = {
    labTestTypeId: 'labTestType-COVID',
  };

  if (!parameters || !Object.keys(parameters).length) {
    return defaultWhereClause;
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      const newWhere = { ...where };
      switch (key) {
        case 'village':
          newWhere['$labRequest->encounter->patient.village_id$'] = value;
          break;
        case 'fromDate':
          if (!newWhere.date) {
            newWhere.date = {};
          }
          newWhere.date[Op.gte] = value;
          break;
        case 'toDate':
          if (!newWhere.date) {
            newWhere.date = {};
          }
          newWhere.date[Op.lte] = value;
          break;
        default:
          break;
      }
      return newWhere;
    }, defaultWhereClause);

  return whereClause;
};

export const permission = 'LabTest';

export const dataGenerator = async (models, parameters = {}) => {
  const reportColumnTemplate = [
    {
      title: 'Patient first name',
      accessor: data => data.labRequest.encounter.patient.firstName,
    },
    {
      title: 'Patient last name',
      accessor: data => data.labRequest.encounter.patient.lastName,
    },
    {
      title: 'DOB',
      accessor: data => moment(data.labRequest.encounter.patient.dateOfBirth).format('DD-MM-YYYY'),
    },
    { title: 'Sex', accessor: data => data.labRequest.encounter.patient.sex },
    { title: 'Patient ID', accessor: data => data.labRequest.encounter.patient.displayId },
    { title: 'Lab request ID', accessor: data => data.labRequest.displayId },
    {
      title: 'Lab request type',
      accessor: data => data.labRequest.category.name,
    },
    { title: 'Status', accessor: data => LAB_REQUEST_STATUS_LABELS[data.status] || data.status },
    { title: 'Result', accessor: data => data.result },
    { title: 'Requested by', accessor: data => data.labRequest.requestedBy },
    { title: 'Date', accessor: data => moment(data.date).format('DD-MM-YYYY') },
    { title: 'Priority', accessor: data => data.labRequest.priority },
    // TODO Testing laboratory column
  ];

  const whereClause = parametersToSqlWhere(parameters);

  const reportData = await models.LabTest.findAll({
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
        ],
      },
      {
        model: models.LabTestType,
        as: 'labTestType',
      },
    ],
    where: whereClause,
  });

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};
