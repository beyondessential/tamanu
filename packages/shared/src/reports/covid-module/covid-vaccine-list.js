/* eslint-disable no-param-reassign */

import { Op } from 'sequelize';
import { endOfDay, parseISO, startOfDay, subDays } from 'date-fns';
import { toDateTimeString, format } from '../../utils/dateTime';
import { generateReportFromQueryData } from '../utilities';

const DATE_FORMAT = 'yyyy/MM/dd';

const reportColumnTemplate = [
  {
    title: 'Patient Name',
    accessor: data => data.patientName,
  },
  { title: 'UID', accessor: data => data.uid },
  { title: 'DOB', accessor: data => format(data.dob, DATE_FORMAT) },
  { title: 'Sex', accessor: data => data.sex },
  { title: 'Village', accessor: data => data.village },
  { title: 'First dose given', accessor: data => data.dose1 },
  {
    title: 'First dose date',
    accessor: data => format(data.dose1Date, DATE_FORMAT),
  },
  { title: 'Second dose given', accessor: data => data.dose2 },
  {
    title: 'Second dose date',
    accessor: data => format(data.dose2Date, DATE_FORMAT),
  },
  { title: 'Vaccine Name', accessor: data => data.vaccineLabel },
];

function parametersToSqlWhere(parameters) {
  parameters.fromDate = toDateTimeString(
    startOfDay(parameters.fromDate ? parseISO(parameters.fromDate) : subDays(new Date(), 30)),
  );

  if (parameters.toDate) {
    parameters.toDate = toDateTimeString(endOfDay(parseISO(parameters.toDate)));
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        switch (key) {
          case 'village':
            where['$encounter->patient.village_id$'] = value;
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
        return where;
      },
      {
        '$scheduledVaccine.label$': {
          [Op.in]: ['COVID-19 AZ', 'COVID-19 Pfizer'],
        },
      },
    );

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
        ],
      },
      {
        model: models.ScheduledVaccine,
        as: 'scheduledVaccine',
      },
    ],
    where: parametersToSqlWhere(parameters),
  });
  const administeredVaccines = result.map(r => r.get({ plain: true }));
  const patients = administeredVaccines.reduce((acc, vaccine) => {
    if (!vaccine.encounter?.patientId) {
      return acc;
    }
    const {
      encounter: {
        patientId,
        patient: { displayId, firstName, lastName, dateOfBirth, village, sex },
      },
      date,
      scheduledVaccine: { schedule, label },
    } = vaccine;
    if (!acc[patientId]) {
      acc[patientId] = {
        patientName: `${firstName} ${lastName}`,
        uid: displayId,
        dob: parseISO(dateOfBirth).toLocaleDateString(),
        village: village?.name,
        dose1: 'No',
        dose2: 'No',
        vaccineLabel: label,
        sex,
      };
    }
    if (schedule === 'Dose 1') {
      acc[patientId].dose1 = 'Yes';
      acc[patientId].dose1Date = parseISO(date).toLocaleDateString();
    }
    if (schedule === 'Dose 2') {
      acc[patientId].dose2 = 'Yes';
      acc[patientId].dose2Date = parseISO(date).toLocaleDateString();
    }
    return acc;
  }, {});
  return Object.values(patients);
}

export async function dataGenerator({ models }, parameters) {
  const queryResults = await queryCovidVaccineListData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}

export const permission = 'PatientVaccine';
