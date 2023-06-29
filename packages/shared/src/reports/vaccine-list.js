import { Op } from 'sequelize';
import { subDays, endOfDay, startOfDay, parseISO } from 'date-fns';
import { generateReportFromQueryData } from './utilities';
import { format, toDateTimeString } from '../utils/dateTime';

export const reportColumnTemplate = [
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
  const newParameters = {
    ...parameters,
    fromDate: toDateTimeString(
      startOfDay(parameters.fromDate ? parseISO(parameters.fromDate) : subDays(new Date(), 30)),
    ),
  };

  if (parameters.toDate) {
    newParameters.toDate = toDateTimeString(endOfDay(parseISO(parameters.toDate)));
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

export async function queryCovidVaccineListData(models, parameters) {
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
      {
        model: models.User,
        as: 'recorder',
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
        patient: { id: patientId, displayId, firstName, lastName, dateOfBirth, village, sex },
        examiner: { displayName: examinerName },
      },
      date,
      status,
      batch,
      scheduledVaccine: { schedule, label: vaccineName },
      recorder,
    } = vaccine;

    const vaccinator = vaccine.givenBy ?? recorder?.displayName ?? examinerName;

    const record = {
      patientId,
      patientName: `${firstName} ${lastName}`,
      uid: displayId,
      dob: format(dateOfBirth, 'dd-MM-yyyy'),
      sex,
      village: village?.name,
      vaccineName,
      schedule,
      vaccineStatus: status === 'GIVEN' ? 'Yes' : 'No',
      vaccineDate: format(date, 'dd-MM-yyyy'),
      batch: status === 'GIVEN' ? batch : '',
      vaccinator: status === 'GIVEN' ? vaccinator : '',
    };

    reportData.push(record);
  }

  return reportData;
}

export async function dataGenerator({ models }, parameters) {
  const queryResults = await queryCovidVaccineListData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}
