import { Op } from 'sequelize';
import { differenceInYears, subDays } from 'date-fns';
import config from 'config';
import moment from 'moment';
import { keyBy } from 'lodash';
import { DATA_TIME_FORMAT, TupaiaApi } from './TupaiaApiStub';
import { generateReportFromQueryData } from './utilities';

const reportColumnTemplate = [
  {
    title: 'village',
    accessor: data => data.village,
  },
  { title: 'tupaiaEntityCode', accessor: data => data.tupaiaEntityCode },
  { title: 'data_time', accessor: data => data.data_time },
  { title: 'COVIDVac1', accessor: data => data.COVIDVac1 },
  { title: 'COVIDVac2', accessor: data => data.COVIDVac2 },
  { title: 'COVIDVac3', accessor: data => data.COVIDVac3 },
  { title: 'COVIDVac4', accessor: data => data.COVIDVac4 },
  { title: 'COVIDVac5', accessor: data => data.COVIDVac5 },
  { title: 'COVIDVac6', accessor: data => data.COVIDVac6 },
  { title: 'COVIDVac7', accessor: data => data.COVIDVac7 },
  { title: 'COVIDVac8', accessor: data => data.COVIDVac8 },
];

function parametersToSqlWhere(parameters) {
  if (!parameters.fromDate) {
    parameters.fromDate = subDays(new Date(), 30).toISOString();
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        switch (key) {
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
        dob: dateOfBirth.toLocaleDateString(),
        village: village?.name ?? 'Unknown Village',
        dose1: 'No',
        dose2: 'No',
        vaccineLabel: label,
        sex,
      };
    }

    if (schedule === 'Dose 1') {
      acc[patientId].dose1 = 'Yes';
      acc[patientId].dose1Date = moment(date).format('YYYY-MM-DD');
      const patientAgeAtThisDate = differenceInYears(date, dateOfBirth);
      acc[patientId].dose1PatientOver65 = patientAgeAtThisDate > 65;
    }
    if (schedule === 'Dose 2') {
      acc[patientId].dose2 = 'Yes';
      acc[patientId].dose2Date = moment(date).format('YYYY-MM-DD');
      const patientAgeAtThisDate = differenceInYears(date, dateOfBirth);
      acc[patientId].dose2PatientOver65 = patientAgeAtThisDate > 65;
    }
    return acc;
  }, {});
  return Object.values(patients);
}

function groupByDateAndVillage(data) {
  const groupedByKey = {};

  for (const item of data) {
    if (!item.tupaiaEntityCode) continue;

    for (const doseKey of ['dose1', 'dose2']) {
      const doseGiven = item[doseKey] === 'Yes';
      if (!doseGiven) continue;

      const doseDate = item[`${doseKey}Date`];

      const key = `${item.tupaiaEntityCode}|${doseDate}`;

      if (!groupedByKey[key]) {
        groupedByKey[key] = {
          village: item.village,
          tupaiaEntityCode: item.tupaiaEntityCode,
          data_time: moment(doseDate)
            .set({ hour: 23, minute: 59, second: 59 })
            .format(DATA_TIME_FORMAT),
          COVIDVac1: 0, // Number of 1st doses given to males on this day
          COVIDVac2: 0, // Number of 1st doses given to females on this day
          COVIDVac3: 0, // Number of 1st doses give to > 65 year old on this day
          COVIDVac4: 0, // Total number of 1st dose given on this day
          COVIDVac5: 0, // Number of 2nd doses given to males on this day
          COVIDVac6: 0, // Number of 2nd doses given to females on this day
          COVIDVac7: 0, // Number of 2nd doses give to > 65 year old on this day
          COVIDVac8: 0, // Total number of 2nd dose given on this day
        };
      }

      if (item.sex === 'male') {
        if (doseKey === 'dose1') {
          groupedByKey[key].COVIDVac1++;
        } else if (doseKey === 'dose2') {
          groupedByKey[key].COVIDVac5++;
        }
      } else if (item.sex === 'female') {
        if (doseKey === 'dose1') {
          groupedByKey[key].COVIDVac2++;
        } else if (doseKey === 'dose2') {
          groupedByKey[key].COVIDVac6++;
        }
      }

      if (item[`${doseKey}PatientOver65`]) {
        if (doseKey === 'dose1') {
          groupedByKey[key].COVIDVac3++;
        } else if (doseKey === 'dose2') {
          groupedByKey[key].COVIDVac7++;
        }
      }

      if (doseKey === 'dose1') {
        groupedByKey[key].COVIDVac4++;
      } else if (doseKey === 'dose2') {
        groupedByKey[key].COVIDVac8++;
      }
    }
  }

  return Object.values(groupedByKey);
}

function addTupaiaEntityCodes(data, villages) {
  const villagesByName = keyBy(villages, 'name');
  return data.map(item => ({
    ...item,
    tupaiaEntityCode: villagesByName[item.village] ? villagesByName[item.village].code : null,
  }));
}

async function getVillages(otherConfig) {
  const tupaiaApi = new TupaiaApi();

  const countryName = config.country ? config.country.name : otherConfig.country?.name;

  if (!countryName || countryName === 'NotSet') {
    throw new Error('Country not set');
  }

  return tupaiaApi.getEntities(countryName, 'village');
}

export async function dataGenerator(models, parameters, otherConfig) {
  const listData = await queryCovidVaccineListData(models, parameters);

  const villages = await getVillages(otherConfig);

  const tupaiaListData = addTupaiaEntityCodes(listData, villages);

  const groupedData = groupByDateAndVillage(tupaiaListData);

  return generateReportFromQueryData(groupedData, reportColumnTemplate);
}

export const permission = 'PatientVaccine';
