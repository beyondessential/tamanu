import { Sequelize, Op } from 'sequelize';
import { groupBy } from 'lodash';
import { generateReportFromQueryData } from './utilities';

const parametersToSqlWhere = parameters => {
  if (!parameters || !Object.keys(parameters).length) {
    return undefined;
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        const newWhere = { ...where };
        switch (key) {
          case 'fromDate':
            newWhere.createdAt[Op.gte] = value;
            break;
          case 'toDate':
            newWhere.createdAt[Op.lte] = value;
            break;
          default:
            break;
        }
        return newWhere;
      },
      { createdAt: {} },
    );

  return whereClause;
};

export const permission = 'Patient';

export const dataGenerator = async (models, parameters = {}) => {
  const reportColumnTemplate = [
    { title: 'Date registered', accessor: data => data.dateCreated },
    { title: 'Registered by', accessor: data =>  },
  ];

  const whereClause = parametersToSqlWhere(parameters);
  const patientsData = await models.Patient.findAll({
    attributes: [
      [Sequelize.literal(`DATE("created_at")`), 'dateCreated'],
      'sex',
    ],
    where: whereClause,
    group: ['dateCreated', 'sex'],
    order: [[Sequelize.literal(`"dateCreated"`), 'ASC']],
  });

  const patientsDataByDate = groupBy(
    patientsData.map(p => p.dataValues),
    'dateCreated',
  );
  const reportData = Object.entries(patientsDataByDate).map(([dateCreated, records]) => {
    const maleRecord = records.find(r => r.sex === 'male');
    const femaleRecord = records.find(r => r.sex === 'female');

    return {
      dateCreated,
    };
  });

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};
