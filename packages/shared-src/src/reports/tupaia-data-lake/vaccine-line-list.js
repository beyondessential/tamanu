import moment from 'moment';
import { Op } from 'sequelize';
import { generateReportFromQueryData } from '../utilities';

const reportColumnTemplate = [
  { title: 'sex', accessor: data => data.sex },
  { title: 'dob', accessor: data => data.dob },
  { title: 'village', accessor: data => data.village },
  { title: 'vax_name', accessor: data => data.vaccineName },
  { title: 'vax_category', accessor: data => data.category },
  { title: 'vax_status', accessor: data => data.vaccineStatus },
  { title: 'schedule', accessor: data => data.schedule },
  { title: 'vax_date', accessor: data => data.vaccineDate },
  { title: 'batch', accessor: data => data.batch },
  { title: 'vaccinator', accessor: data => data.vaccinator },
];

function parametersToSqlWhere(parameters) {
  // default fromDate for this report is undefined in order to push all data.

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      const newWhere = { ...where };
      switch (key) {
        case 'village':
          newWhere['$encounter->patient.village_id$'] = value;
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
        case 'category':
          newWhere['$scheduledVaccine.category$'] = value;
          break;
        case 'vaccine':
          newWhere['$scheduledVaccine.label$'] = value;
          break;
        default:
          break;
      }
      return newWhere;
    }, {});

  return whereClause;
}

async function queryVaccineListData(models, parameters) {
  const result = await models.AdministeredVaccine.findAll({
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
          {
            model: models.User,
            as: 'examiner',
          },
        ],
      },
      {
        model: models.ScheduledVaccine,
        as: 'scheduledVaccine',
      },
    ],
    where: parametersToSqlWhere(parameters),
    order: [
      [
        { model: models.Encounter, as: 'encounter' },
        { model: models.Patient, as: 'patient' },
        'id',
        'ASC',
      ],
      ['date', 'ASC'],
    ],
  });
  const administeredVaccines = result.map(r => r.get({ plain: true }));

  const reportData = [];
  for (const vaccine of administeredVaccines) {
    if (!vaccine.encounter?.patientId) {
      continue;
    }
    const {
      encounter: {
        patient: { dateOfBirth, village, sex },
        examiner: { displayName: examinerName },
      },
      date,
      status,
      batch,
      scheduledVaccine: { category, schedule, label: vaccineName },
    } = vaccine;

    const record = {
      dob: moment(dateOfBirth).format('DD-MM-YYYY'),
      sex,
      village: village?.name,
      vaccineName,
      category,
      schedule,
      vaccineStatus: status === 'GIVEN' ? 'Yes' : 'No',
      vaccineDate: moment(date).format('DD-MM-YYYY'),
      batch: status === 'GIVEN' ? batch : '',
      vaccinator: status === 'GIVEN' ? examinerName : '',
    };

    reportData.push(record);
  }

  return reportData;
}

export async function dataGenerator({ models }, parameters) {
  const queryResults = await queryVaccineListData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}

export const permission = 'PatientVaccine';
