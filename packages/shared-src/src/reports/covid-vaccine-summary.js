import { Op } from 'sequelize';
import moment from 'moment';
import { differenceInYears } from 'date-fns';

function parametersToSqlWhere(parameters) {
  if (!parameters.fromDate) {
    parameters.fromDate = moment()
      .subtract(30, 'days')
      .toISOString();
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
        '$scheduledVaccine.label$': 'COVAX',
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
    function(acc, vaccine) {
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
      if (acc['male'][villageName] === undefined) {
        acc['male'][villageName] = 0;
      }
      if (acc['female'][villageName] === undefined) {
        acc['female'][villageName] = 0;
      }
      acc[sex][villageName] = acc[sex][villageName] + 1;

      const patientAge = differenceInYears(today, dateOfBirth);
      if (acc['over65'][villageName] === undefined) {
        acc['over65'][villageName] = 0;
      }
      if (patientAge > 65) {
        acc['over65'][villageName] = acc['over65'][villageName] + 1;
      }

      if (acc['total'][villageName] === undefined) {
        acc['total'][villageName] = 0;
      }
      acc['total'][villageName] = acc['total'][villageName] + 1;

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
    ['Male', ...allVillages.map(v => countBySheet['male'][v])],
    ['Female', ...allVillages.map(v => countBySheet['female'][v])],
    ['> 65 y.o', ...allVillages.map(v => countBySheet['over65'][v])],
    ['Total', ...allVillages.map(v => countBySheet['total'][v])],
  ];
}

async function generateCovidVaccineSummaryReport(models, parameters) {
  return await queryCovidVaccineSummaryData(models, parameters);
}

export async function generateCovidVaccineSummaryDose1Report(models, parameters) {
  parameters.schedule = 'Dose 1';
  return await generateCovidVaccineSummaryReport(models, parameters);
}

export async function generateCovidVaccineSummaryDose2Report(models, parameters) {
  parameters.schedule = 'Dose 2';
  return await generateCovidVaccineSummaryReport(models, parameters);
}

export const permission = 'PatientVaccine';
