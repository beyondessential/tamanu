import moment from 'moment';
import { Op } from 'sequelize';
import { subDays } from 'date-fns';
import { generateReportFromQueryData } from './utilities';

const reportColumnTemplate = [
  {
    title: 'Patient Name',
    accessor: data => data.patientName,
  },
  { title: 'UID', accessor: data => data.uid },
  { title: 'DOB', accessor: data => data.dob },
  { title: 'Sex', accessor: data => data.sex },
  { title: 'Village', accessor: data => data.village },
  { title: 'Vaccine name', accessor: data => data.vaccineName },
  { title: 'Vaccine status', accessor: data => data.vaccineStatus },
  { title: 'Schedule', accessor: data => data.schedule },
  { title: 'Vaccine date', accessor: data => data.vaccineDate },
  { title: 'Batch', accessor: data => data.batch },
  { title: 'Vaccinator', accessor: data => data.vaccinator },
];

function parametersToSqlWhere(parameters) {
  const newParameters = { ...parameters };
  if (!newParameters.fromDate) {
    newParameters.fromDate = subDays(new Date(), 30).toISOString();
  }

  const whereClause = Object.entries(newParameters)
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

async function queryCovidVaccineListData(models, parameters) {
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
        patient: { displayId, firstName, lastName, dateOfBirth, village, sex },
        examiner: { displayName: examinerName },
      },
      date,
      status,
      batch,
      scheduledVaccine: { schedule, label: vaccineName },
    } = vaccine;

    const record = {
      patientName: `${firstName} ${lastName}`,
      uid: displayId,
      dob: moment(dateOfBirth).format('DD-MM-YYYY'),
      sex,
      village: village?.name,
      vaccineName,
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

export async function dataGenerator(models, parameters) {
  const queryResults = await queryCovidVaccineListData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}

export const permission = 'PatientVaccine';
