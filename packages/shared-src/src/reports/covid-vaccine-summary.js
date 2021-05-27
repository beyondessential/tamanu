import { Op } from 'sequelize';
import { differenceInYears, subDays } from 'date-fns';

function parametersToSqlWhere(parameters) {
  if (!parameters.fromDate) {
    parameters.fromDate = subDays(new Date(), 30).toISOString();
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
  const today = new Date();
  const countBySheet = administeredVaccines.reduce(
    (acc, vaccine) => {
      if (!vaccine.encounter?.patientId) {
        return acc;
      }

      const {
        encounter: {
          patient: { dateOfBirth, village, sex: sexObject },
        },
      } = vaccine;
      const sex = sexObject?.name;

      const villageName = village?.name ?? 'Unknown';
      acc.uniqueVillages[villageName] = true;
      if (sex === 'male' || sex === 'female') {
        acc[sex][villageName] = (acc[sex][villageName] || 0) + 1;
      }

      const patientAge = differenceInYears(today, dateOfBirth);
      if (patientAge > 65) {
        acc.over65[villageName] = (acc.over65[villageName] || 0) + 1;
      }

      acc.total[villageName] = (acc.total[villageName] || 0) + 1;

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

async function generateCovidVaccineSummaryReport(models, parameters) {
  return queryCovidVaccineSummaryData(models, parameters);
}

export async function generateCovidVaccineSummaryDose1Report(models, parameters) {
  return generateCovidVaccineSummaryReport(models, { ...parameters, schedule: 'Dose 1' });
}

export async function generateCovidVaccineSummaryDose2Report(models, parameters) {
  return generateCovidVaccineSummaryReport(models, { ...parameters, schedule: 'Dose 2' });
}

export const permission = 'PatientVaccine';
