/* eslint-disable no-param-reassign */

import { Op } from 'sequelize';
import { endOfDay, parseISO, startOfDay, subDays } from 'date-fns';
import { ageInYears, toDateTimeString } from '../../utils/dateTime';

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
          case 'schedule':
            where['$scheduledVaccine.schedule$'] = value;
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
          [Op.in]: ['COVAX', 'COVID-19'],
        },
      },
    );

  return whereClause;
}

async function queryCovidVaccineSummaryData(models, parameters) {
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
  const countBySheet = administeredVaccines.reduce(
    (acc, vaccine) => {
      if (!vaccine.encounter?.patientId) {
        return acc;
      }

      const {
        encounter: {
          patient: { dateOfBirth, village, sex },
        },
      } = vaccine;

      const villageName = village?.name ?? 'Unknown';
      acc.uniqueVillages[villageName] = true;
      if (acc.male[villageName] === undefined) {
        acc.male[villageName] = 0;
      }
      if (acc.female[villageName] === undefined) {
        acc.female[villageName] = 0;
      }
      acc[sex][villageName] += 1;

      const patientAge = ageInYears(dateOfBirth);
      if (acc.over65[villageName] === undefined) {
        acc.over65[villageName] = 0;
      }
      if (patientAge > 65) {
        acc.over65[villageName] += 1;
      }

      if (acc.total[villageName] === undefined) {
        acc.total[villageName] = 0;
      }
      acc.total[villageName] += 1;

      return acc;
    },
    {
      uniqueVillages: { Unknown: true },
      male: {},
      female: {},
      over65: {},
      total: {},
    },
  );

  const allVillages = Object.keys(countBySheet.uniqueVillages);
  // manually generate excel data
  return [
    // first row, labels, first column is empty
    ['', ...allVillages],
    ['Male', ...allVillages.map(v => countBySheet.male[v])],
    ['Female', ...allVillages.map(v => countBySheet.female[v])],
    ['> 65 y.o', ...allVillages.map(v => countBySheet.over65[v])],
    ['Total', ...allVillages.map(v => countBySheet.total[v])],
  ];
}

async function generateCovidVaccineSummaryReport({ models }, parameters) {
  return queryCovidVaccineSummaryData(models, parameters);
}

export async function generateCovidVaccineSummaryDose1Report(context, parameters) {
  parameters.schedule = 'Dose 1';
  return generateCovidVaccineSummaryReport(context, parameters);
}

export async function generateCovidVaccineSummaryDose2Report(context, parameters) {
  parameters.schedule = 'Dose 2';
  return generateCovidVaccineSummaryReport(context, parameters);
}
