const { customAlphabet } = require('nanoid');
const { readFile, utils } = require('xlsx');
const moment = require('moment');
const _ = require('lodash');
const fetch = require('node-fetch');

const ALPHABET_FOR_ID =
  // this is absolutely fine and the concat isn't useless
  // eslint-disable-next-line no-useless-concat
  'ABCDEFGH' + /* I */ 'JK' + /* L */ 'MN' + /* O */ 'PQRSTUVWXYZ' + /* 01 */ '23456789';

// const [nodeName, scriptName, fromUrl, toUrl] = process.argv;

const SLEEP_TIME = 100;

const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzNzZkOTQxMi04ZDk0LTRmNGItOWZmNS03ZGIxYjQ5NmViNWIiLCJpYXQiOjE2NDM1OTM3NzYsImV4cCI6MTY0MzU5NzM3Nn0.EZPOisvBsBV2YxHcfEHaOnNd3EJln1RkcxhtoDCwWjo';

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  Accepts: 'application/json',
};

const BASE_URL = 'http://localhost:4000';

const VACCINE_STATUS = {
  UNKNOWN: 'UNKNOWN',
  GIVEN: 'GIVEN',
  NOT_GIVEN: 'NOT_GIVEN',
  SCHEDULED: 'SCHEDULED',
  MISSED: 'MISSED',
  DUE: 'DUE',
  UPCOMING: 'UPCOMING',
  OVERDUE: 'OVERDUE',
  RECORDED_IN_ERROR: 'RECORDED_IN_ERROR',
};

const ENCOUNTER_TYPES = {
  ADMISSION: 'admission',
  CLINIC: 'clinic',
  IMAGING: 'imaging',
  EMERGENCY: 'emergency',
  OBSERVATION: 'observation',
  TRIAGE: 'triage',
  SURVEY_RESPONSE: 'surveyResponse',
};

const FILE = './data.xlsx';

const asyncSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const parseSheet = sheetJson => {
  const { patientId, result, time } = sheetJson;
  const time2 = new Date(Math.round((time - 25569) * 86400 * 1000));
  const timeOfEverything = addMinutesToDate(time2, 60);
  // console.log(time, time2, timeOfEverything);
  return {
    patientId,
    positive: result === 'Positive',
    // Months are 0 indexed??
    timeOfEverything,
  };
};

const importExcelSheet = () => {
  const workbook = readFile(FILE);
  // Strip some characters from workbook names before trying to find them
  // (this mirrors the punctuation stripping that node-xlsx does internally)
  const worksheet = workbook.Sheets.hi;
  const data = utils.sheet_to_json(worksheet);

  const hi = data.map(parseSheet).filter(({ patientId }) => !(patientId && patientId.length > 10));
  console.log(hi);
};

const addMinutesToDate = (initialDate, minutes) => {
  const numberOfMlSeconds = initialDate.getTime();
  const addMlSeconds = minutes * 60 * 1000;
  return new Date(numberOfMlSeconds + addMlSeconds);
};

const postEncounter = async encounterData => {
  const url = `${BASE_URL}/v1/sync/encounter`;
  const response = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(encounterData),
  });
  if (!response.ok) {
    console.warn(`  -x ERROR: ${await response.text()}`);
    throw new Error('oop');
  }
  return response.json();
};

const postAdministeredVaccine = async labRequestData => {
  const url = `${BASE_URL}/v1/sync/administeredVaccine`;
  const response = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(labRequestData),
  });
  if (!response.ok) {
    console.warn(`  -x ERROR: ${await response.text()}`);
    throw new Error('oop 2');
  }
  return response.json();
};

async function postEverything(data) {
  const { patientId, givenBy, batch, injectionSite, timeOfEverything } = data;

  const adminUserId = 'user-MHHSTesting'; // constant

  const encounterData = {
    patientId,
    encounterType: ENCOUNTER_TYPES.CLINIC, // TODO
    departmentId: 'department-laboratory',
    locationId: 'location-laboratory',
    deviceId: 'manual_import',
    reasonForEncounter: 'Imported lab request',
    method: 'labTestMethod-RDT',
    examinerId: adminUserId,
    startDate: timeOfEverything,
    endDate: addMinutesToDate(timeOfEverything, 60),
  };

  const administeredVaccineData = {
    batch,
    status: VACCINE_STATUS.GIVEN,
    reason: undefined,
    location: patientId,
    date: addMinutesToDate(timeOfEverything, 10),
    // scheduledVaccineId: patientId, // TODO
    injectionSite,
  };

  const encounter = await postEncounter(encounterData);

  console.log(encounter);

  const administeredVaccine = await postAdministeredVaccine({
    ...administeredVaccineData,
    encounterId: encounter.id,
  });

  console.log(administeredVaccine);
}

(async () => {
  // const vaccinations = await importExcelSheet();
  for (const administeredVaccine of ['vaccinations', 'b']) {
    // await postEverything(administeredVaccine);
    console.log(administeredVaccine);
    await asyncSleep(2000);
  }
})()
  .then(() => {
    console.log('success!');
  })
  .catch(e => {
    console.error('caught error, stopping...');
    throw e;
  });
