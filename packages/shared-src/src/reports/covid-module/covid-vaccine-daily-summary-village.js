/* eslint-disable no-param-reassign */

import { Op } from 'sequelize';
import config from 'config';
import moment from 'moment';
import { keyBy } from 'lodash';
import { DATA_TIME_FORMAT } from '@tupaia/api-client';
import { parseISO, format } from 'date-fns';
import { generateReportFromQueryData } from '../utilities';

const reportColumnTemplate = [
  { title: 'entity_code', accessor: data => data.tupaiaEntityCode },
  { title: 'timestamp', accessor: data => format(parseISO(data.data_time), 'yyyy/MM/dd HH:mm:ss') },
  {
    title: 'start_time',
    accessor: data => format(parseISO(data.start_time), 'yyyy/MM/dd HH:mm:ss'),
  },
  { title: 'end_time', accessor: data => format(parseISO(data.end_time), 'yyyy/MM/dd HH:mm:ss') },
  { title: 'COVIDVac1', accessor: data => data.COVIDVac1 },
  { title: 'COVIDVac2', accessor: data => data.COVIDVac2 },
  { title: 'COVIDVac3', accessor: data => data.COVIDVac3 },
  { title: 'COVIDVac4', accessor: data => data.COVIDVac4 },
  { title: 'COVIDVac5', accessor: data => data.COVIDVac5 },
  { title: 'COVIDVac6', accessor: data => data.COVIDVac6 },
  { title: 'COVIDVac7', accessor: data => data.COVIDVac7 },
  { title: 'COVIDVac8', accessor: data => data.COVIDVac8 },
  { title: 'COVIDVac9', accessor: data => data.COVIDVac9 },
  { title: 'COVIDVac10', accessor: data => data.COVIDVac10 },
  { title: 'COVIDVac11', accessor: data => data.COVIDVac11 },
  { title: 'COVIDVac12', accessor: data => data.COVIDVac12 },
  { title: 'COVIDVac13', accessor: data => data.COVIDVac13 },
  { title: 'COVIDVac14', accessor: data => data.COVIDVac14 },
  { title: 'COVIDVac15', accessor: data => data.COVIDVac15 },
  { title: 'COVIDVac16', accessor: data => data.COVIDVac16 },
  { title: 'COVIDVac17', accessor: data => data.COVIDVac17 },
  { title: 'COVIDVac18', accessor: data => data.COVIDVac18 },
  { title: 'COVIDVac19', accessor: data => data.COVIDVac19 },
  { title: 'COVIDVac20', accessor: data => data.COVIDVac20 },
  { title: 'COVIDVac21', accessor: data => data.COVIDVac21 },
  { title: 'COVIDVac22', accessor: data => data.COVIDVac22 },
  { title: 'COVIDVac23', accessor: data => data.COVIDVac23 },
  { title: 'COVIDVac24', accessor: data => data.COVIDVac24 },
];

// tamanu name -> tupaia code
const MANUAL_VILLAGE_MAPPING = {
  'Vailoa Savaii': 'WS_012_Vailoa_Satupaitea',
};

// Samoa has an offset of UTC+13, no DST
const UTC_OFFSET = 13;

function getDateRange(parameters) {
  const fromDate = parameters.fromDate
    ? moment(parameters.fromDate).utcOffset(UTC_OFFSET)
    : moment()
        .utcOffset(UTC_OFFSET)
        .subtract(3, 'months');
  const toDate = parameters.toDate
    ? moment(parameters.toDate).utcOffset(UTC_OFFSET)
    : moment().utcOffset(UTC_OFFSET);

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
          [Op.in]: ['COVID-19-AZ', 'COVID-19 AZ', 'Covid-19 Pfizer'],
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
      status,
      scheduledVaccine: { schedule, label },
    } = vaccine;

    if (status !== 'GIVEN') {
      return acc;
    }

    if (!acc[patientId]) {
      acc[patientId] = {
        patientName: `${firstName} ${lastName}`,
        uid: displayId,
        dob: dateOfBirth.toLocaleDateString(),
        village: village?.name ?? 'Unknown Village',
        dose1: 'No',
        dose2: 'No',
        booster: 'No',
        vaccineLabel: `${label.includes('AZ') ? 'AZ' : 'PF'}`,
        sex,
      };
    }

    const doseDate = moment(date)
      .utcOffset(UTC_OFFSET)
      .format('YYYY-MM-DD');
    const doseDateTime = moment(date)
      .utcOffset(UTC_OFFSET)
      .set({ hour: 23, minute: 59, second: 59 })
      .format(DATA_TIME_FORMAT);

    const date65yearsBeforeDose = moment(date).subtract(65, 'years');
    const patientOver65AtDoseDate = moment(dateOfBirth).isBefore(date65yearsBeforeDose);

    if (schedule === 'Dose 1') {
      // if multiple doses use earliest
      if (!acc[patientId].dose1Date || doseDate < acc[patientId].dose1Date) {
        acc[patientId].dose1 = 'Yes';
        acc[patientId].dose1Date = doseDate;
        acc[patientId].dose1DateTime = doseDateTime;
        acc[patientId].dose1PatientOver65 = patientOver65AtDoseDate;
      }
    }
    if (schedule === 'Dose 2') {
      // if multiple doses use earliest
      if (!acc[patientId].dose2Date || doseDate < acc[patientId].dose2Date) {
        acc[patientId].dose2 = 'Yes';
        acc[patientId].dose2Date = doseDate;
        acc[patientId].dose2DateTime = doseDateTime;
        acc[patientId].dose2PatientOver65 = patientOver65AtDoseDate;
      }
    }
    if (schedule === 'booster') {
      // if multiple doses use earliest
      if (!acc[patientId].boosterDate || doseDate < acc[patientId].boosterDate) {
        acc[patientId].booster = 'Yes';
        acc[patientId].boosterDate = doseDate;
        acc[patientId].boosterDateTime = doseDateTime;
        acc[patientId].boosterPatientOver65 = patientOver65AtDoseDate;
      }
    }
    return acc;
  }, {});
  return Object.values(patients);
}

function groupByDateAndVillage(data, now) {
  const groupedByKey = {};

  const nowStr = now.format();

  for (const item of data) {
    if (!item.tupaiaEntityCode) continue;

    for (const doseKey of ['dose1', 'dose2', 'booster']) {
      const doseGiven = item[doseKey] === 'Yes';
      if (!doseGiven) continue;

      const doseDate = item[`${doseKey}Date`];
      const doseDateTime = item[`${doseKey}DateTime`];

      const key = `${item.tupaiaEntityCode}|${doseDate}`;

      if (!groupedByKey[key]) {
        groupedByKey[key] = {
          village: item.village,
          tupaiaEntityCode: item.tupaiaEntityCode,
          data_time: doseDateTime,
          start_time: nowStr,
          end_time: nowStr,
          COVIDVac1: 0, // Number of 1st doses given to males on this day
          COVIDVac2: 0, // Number of 1st doses given to females on this day
          COVIDVac3: 0, // Number of 1st doses give to > 65 year old on this day
          COVIDVac4: 0, // Total number of 1st dose given on this day
          COVIDVac5: 0, // Number of 2nd doses given to males on this day
          COVIDVac6: 0, // Number of 2nd doses given to females on this day
          COVIDVac7: 0, // Number of 2nd doses give to > 65 year old on this day
          COVIDVac8: 0, // Total number of 2nd dose given on this day
          COVIDVac9: 0, // Number of AstraZeneca Booster doses given to males on this day
          COVIDVac10: 0, // Number of AstraZeneca Booster doses given to females on this day
          COVIDVac11: 0, // Number of AstraZeneca Booster doses give to > 60 year old on this day
          COVIDVac12: 0, // Total number of AstraZeneca Booster dose given on this day
          COVIDVac13: 0, // Number of Pfizer 1st doses given to males on this day
          COVIDVac14: 0, // Number of Pfizer 1st doses given to females on this day
          COVIDVac15: 0, // Number of Pfizer 1st doses give to > 60 year old on this day
          COVIDVac16: 0, // Total number of Pfizer 1st dose given on this day
          COVIDVac17: 0, // Number of Pfizer 2nd doses given to males on this day
          COVIDVac18: 0, // Number of Pfizer 2nd doses given to females on this day
          COVIDVac19: 0, // Number of Pfizer 2nd doses give to > 60 year old on this day
          COVIDVac20: 0, // Total number of Pfizer 2nd dose given on this day
          COVIDVac21: 0, // Number of Pfizer Booster doses given to males on this day
          COVIDVac22: 0, // Number of Pfizer Booster doses given to females on this day
          COVIDVac23: 0, // Number of Pfizer Booster doses give to > 60 year old on this day
          COVIDVac24: 0, // Total number of Pfizer Booster dose given on this day
        };
      }

      // Check vaccine label (astra zeneca, pfizer)
      const checkDataElementNumber = baseNumber =>
        item.vaccineLabel === 'AZ' ? baseNumber : baseNumber + 12;

      if (item.sex === 'male') {
        if (doseKey === 'dose1') {
          groupedByKey[key][`COVIDVac${checkDataElementNumber(1)}`]++;
        } else if (doseKey === 'dose2') {
          groupedByKey[key][`COVIDVac${checkDataElementNumber(5)}`]++;
        } else if (doseKey === 'booster') {
          groupedByKey[key][`COVIDVac${checkDataElementNumber(9)}`]++;
        }
      } else if (item.sex === 'female') {
        if (doseKey === 'dose1') {
          groupedByKey[key][`COVIDVac${checkDataElementNumber(2)}`]++;
        } else if (doseKey === 'dose2') {
          groupedByKey[key][`COVIDVac${checkDataElementNumber(6)}`]++;
        } else if (doseKey === 'booster') {
          groupedByKey[key][`COVIDVac${checkDataElementNumber(10)}`]++;
        }
      }

      if (item[`${doseKey}PatientOver65`]) {
        if (doseKey === 'dose1') {
          groupedByKey[key][`COVIDVac${checkDataElementNumber(3)}`]++;
        } else if (doseKey === 'dose2') {
          groupedByKey[key][`COVIDVac${checkDataElementNumber(7)}`]++;
        } else if (doseKey === 'booster') {
          groupedByKey[key][`COVIDVac${checkDataElementNumber(11)}`]++;
        }
      }

      if (doseKey === 'dose1') {
        groupedByKey[key][`COVIDVac${checkDataElementNumber(4)}`]++;
      } else if (doseKey === 'dose2') {
        groupedByKey[key][`COVIDVac${checkDataElementNumber(8)}`]++;
      } else if (doseKey === 'booster') {
        groupedByKey[key][`COVIDVac${checkDataElementNumber(12)}`]++;
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

function withEmptyRows(groupedData, parameters, villages, now) {
  const dateRange = getDateRange(parameters);

  const padded = groupedData;

  const nowStr = now.format();

  for (const village of villages) {
    let d = dateRange.fromDate.clone();
    while (d.isBefore(dateRange.toDate) || d.isSame(dateRange.toDate, 'day')) {
      const dataTime = d.set({ hour: 23, minute: 59, second: 59 }).format(DATA_TIME_FORMAT);

      const exists =
        groupedData.find(
          row => row.data_time === dataTime && row.tupaiaEntityCode === village.code,
        ) !== undefined;

      if (!exists) {
        padded.push({
          village: village.name,
          tupaiaEntityCode: village.code,
          data_time: dataTime,
          start_time: nowStr,
          end_time: nowStr,
          COVIDVac1: null,
          COVIDVac2: null,
          COVIDVac3: null,
          COVIDVac4: null,
          COVIDVac5: null,
          COVIDVac6: null,
          COVIDVac7: null,
          COVIDVac8: null,
          COVIDVac9: null,
          COVIDVac10: null,
          COVIDVac11: null,
          COVIDVac12: null,
          COVIDVac13: null,
          COVIDVac14: null,
          COVIDVac15: null,
          COVIDVac16: null,
          COVIDVac17: null,
          COVIDVac18: null,
          COVIDVac19: null,
          COVIDVac20: null,
          COVIDVac21: null,
          COVIDVac22: null,
          COVIDVac23: null,
          COVIDVac24: null,
        });
      }

      d = d.add(1, 'day');
    }
  }

  return padded;
}

export async function dataGenerator({ models }, parameters, tupaiaApi) {
  const listData = await queryCovidVaccineListData(models, parameters);

  const villages = await getVillages(tupaiaApi);

  const tupaiaListData = addTupaiaEntityCodes(listData, villages);

  const now = moment();

  const groupedData = groupByDateAndVillage(tupaiaListData, now);

  const padded = withEmptyRows(groupedData, parameters, villages, now);

  return generateReportFromQueryData(padded, reportColumnTemplate);
}

export const permission = 'PatientVaccine';

export const needsTupaiaApiClient = true;
