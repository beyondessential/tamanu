import { Sequelize, Op } from 'sequelize';
import { groupBy } from 'lodash';
import { format } from 'date-fns';
import { generateReportFromQueryData } from '../utilities';

const parametersToSqlWhere = parameters => {
  const defaultWhereClause = {
    '$labRequest.lab_test_category_id$': 'labTestCategory-COVID',
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
        case 'labTestLaboratory':
          newWhere['$labRequest.lab_test_laboratory_id$'] = value;
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

export const dataGenerator = async ({ models }, parameters = {}) => {
  const reportColumnTemplate = [
    {
      title: 'Date',
      accessor: data => format(new Date(data.testDate), 'yyyy/MM/dd'),
    },
    {
      title: 'Total tests',
      accessor: data => data.totalRecordCount,
    },
    {
      title: 'Negative',
      accessor: data => data.negativeRecordCount,
    },
    {
      title: 'Positive',
      accessor: data => data.positiveRecordCount,
    },
    { title: 'Inconclusive', accessor: data => data.inconclusiveRecordCount },
    { title: 'No result yet', accessor: data => data.noResultRecordCount },
  ];

  const whereClause = parametersToSqlWhere(parameters);

  const labTestData = await models.LabTest.findAll({
    includeIgnoreAttributes: false,
    attributes: [
      [Sequelize.literal(`DATE("date")`), 'testDate'],
      'result',
      [Sequelize.literal(`COUNT(*)`), 'count'],
    ],
    include: [
      {
        model: models.LabRequest,
        as: 'labRequest',
        attributes: [],
        include: [
          {
            model: models.Encounter,
            as: 'encounter',
            attributes: [],
            include: [
              {
                model: models.Patient,
                as: 'patient',
                attributes: [],
                include: [{ model: models.ReferenceData, as: 'village' }],
              },
            ],
          },
          { model: models.ReferenceData, as: 'laboratory' },
        ],
      },
    ],
    where: whereClause,
    group: ['testDate', 'result'],
    order: [[Sequelize.literal(`"testDate"`), 'ASC']],
  });
  const labTestDataByDate = groupBy(
    labTestData.map(p => p.dataValues),
    'testDate',
  );
  const reportData = Object.entries(labTestDataByDate).map(([testDate, records]) => {
    const positiveRecord = records.find(r => r.result === 'Positive');
    const negativeRecord = records.find(r => r.result === 'Negative');
    const inconclusiveRecord = records.find(r => r.result === 'Inconclusive');
    const noResultRecord = records.find(r => r.result === null || r.result === '');

    const positiveRecordCount = positiveRecord ? Number(positiveRecord.count) : 0;
    const negativeRecordCount = negativeRecord ? Number(negativeRecord.count) : 0;
    const inconclusiveRecordCount = inconclusiveRecord ? Number(inconclusiveRecord.count) : 0;
    const noResultRecordCount = noResultRecord ? Number(noResultRecord.count) : 0;
    const totalRecordCount =
      positiveRecordCount + negativeRecordCount + inconclusiveRecordCount + noResultRecordCount;

    return {
      testDate,
      positiveRecordCount,
      negativeRecordCount,
      inconclusiveRecordCount,
      noResultRecordCount,
      totalRecordCount,
    };
  });

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};
