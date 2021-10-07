import { Op } from 'sequelize';
import config from 'config';
import moment from 'moment';
import { keyBy } from 'lodash';
import { DATA_TIME_FORMAT } from '@tupaia/api-client';
import { generateReportFromQueryData } from './utilities';

const DATE_FNS_DATE_FORMAT = 'YYYY-MM-dd';

const reportColumnTemplate = [
  { title: 'entity_code', accessor: data => data.tupaiaEntityCode },
  { title: 'timestamp', accessor: data => data.data_time },
  { title: 'COVIDVac1', accessor: data => data.COVIDVac1 },
  { title: 'COVIDVac2', accessor: data => data.COVIDVac2 },
  { title: 'COVIDVac3', accessor: data => data.COVIDVac3 },
  { title: 'COVIDVac4', accessor: data => data.COVIDVac4 },
  { title: 'COVIDVac5', accessor: data => data.COVIDVac5 },
  { title: 'COVIDVac6', accessor: data => data.COVIDVac6 },
  { title: 'COVIDVac7', accessor: data => data.COVIDVac7 },
  { title: 'COVIDVac8', accessor: data => data.COVIDVac8 },
];

// tamanu name -> tupaia code
const MANUAL_VILLAGE_MAPPING = {
  'Vailoa Savaii': 'WS_012_Vailoa_Satupaitea',
};

function getDateRange(parameters) {
  const fromDate = parameters.fromDate ? moment.utc(parameters.fromDate) : moment.utc();
  const toDate = parameters.toDate ? moment.utc(parameters.toDate) : moment.utc();
  fromDate.set({ hour: 0, minute: 0, second: 0 });
  toDate.set({ hour: 23, minute: 59, second: 59 });
  if (fromDate.isAfter(toDate)) {
    throw new Error('fromDate must be before toDate');
  }
  return {
    fromDate,
    toDate,
  };
}

function parametersToSqlWhere(parameters) {
  const dateRange = getDateRange(parameters);

  parameters.fromDate = dateRange.fromDate;
  parameters.toDate = dateRange.toDate;

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        switch (key) {
          case 'fromDate':
            if (!where.date) {
              where.date = {};
            }
            where.date[Op.gte] = value.toISOString();
            break;
          case 'toDate':
            if (!where.date) {
              where.date = {};
            }
            where.date[Op.lte] = value.toISOString();
            break;
          default:
            break;
        }
        return where;
      },
      {
        '$scheduledVaccine.label$': {
          [Op.in]: ['COVAX', 'COVID-19 AZ'],
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

    const doseDate = moment.utc(date).format('YYYY-MM-DD');
    const patientAgeAtThisDate = moment.utc(date).diff(dateOfBirth, 'years');

    if (schedule === 'Dose 1') {
      // if multiple doses use earliest
      if (!acc[patientId].dose1Date || doseDate < acc[patientId].dose1Date) {
        acc[patientId].dose1 = 'Yes';
        acc[patientId].dose1Date = doseDate;
        acc[patientId].dose1PatientOver65 = patientAgeAtThisDate > 65;
      }
    }
    if (schedule === 'Dose 2') {
      // if multiple doses use earliest
      if (!acc[patientId].dose2Date || doseDate < acc[patientId].dose2Date) {
        acc[patientId].dose2 = 'Yes';
        acc[patientId].dose2Date = doseDate;
        acc[patientId].dose2PatientOver65 = patientAgeAtThisDate > 65;
      }
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

  const getTupaiaEntityCode = villageName => {
    if (MANUAL_VILLAGE_MAPPING[villageName]) {
      return MANUAL_VILLAGE_MAPPING[villageName];
    }
    if (villagesByName[villageName]) {
      return villagesByName[villageName].code;
    }
    // Some villages are expected to be ignored
    return null;
  };

  return data.map(item => ({
    ...item,
    tupaiaEntityCode: getTupaiaEntityCode(item.village),
  }));
}

async function getVillages(tupaiaApi) {
  const reportConfig = config.reports?.['covid-vaccine-daily-summary-village'];

  if (!reportConfig) {
    throw new Error('Report not configured');
  }

  const { hierarchyName, countryCode } = reportConfig;

  const entities = await tupaiaApi.entity.getDescendantsOfEntity(hierarchyName, countryCode, {
    fields: ['code', 'name', 'type'],
    filter: {
      type: 'village',
    },
  });

  return entities;
}

function withEmptyRows(groupedData, parameters, villages) {
  const dateRange = getDateRange(parameters);

  const padded = groupedData;

  for (const village of villages) {
    let d = dateRange.fromDate.clone();
    while (d.isBefore(dateRange.toDate) || d.isSame(dateRange.toDate, 'day')) {
      const dataTime = moment
        .utc(d)
        .set({ hour: 23, minute: 59, second: 59 })
        .format(DATA_TIME_FORMAT);

      const exists =
        groupedData.find(
          row => row.data_time === dataTime && row.tupaiaEntityCode === village.code,
        ) !== undefined;

      if (!exists) {
        padded.push({
          village: village.name,
          tupaiaEntityCode: village.code,
          data_time: dataTime,
          COVIDVac1: '',
          COVIDVac2: '',
          COVIDVac3: '',
          COVIDVac4: '',
          COVIDVac5: '',
          COVIDVac6: '',
          COVIDVac7: '',
          COVIDVac8: '',
        });
      }

      d = d.add(1, 'day');
    }
  }

  return padded;
}

export async function dataGenerator(models, parameters, tupaiaApi) {
  const listData = await queryCovidVaccineListData(models, parameters);

  const villages = await getVillages(tupaiaApi);

  const tupaiaListData = addTupaiaEntityCodes(listData, villages);

  const groupedData = groupByDateAndVillage(tupaiaListData);

  const padded = withEmptyRows(groupedData, parameters, villages);

  return generateReportFromQueryData(padded, reportColumnTemplate);
}

export const permission = 'PatientVaccine';

export const needsTupaiaApiClient = true;
