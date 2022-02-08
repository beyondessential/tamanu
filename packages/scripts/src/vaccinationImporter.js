const { customAlphabet } = require('nanoid');
const { readFile, utils } = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const _ = require('lodash');
const fetch = require('node-fetch');

const ALPHABET_FOR_ID =
  // this is absolutely fine and the concat isn't useless
  // eslint-disable-next-line no-useless-concat
  'ABCDEFGH' + /* I */ 'JK' + /* L */ 'MN' + /* O */ 'PQRSTUVWXYZ' + /* 01 */ '23456789';

// const [nodeName, scriptName, fromUrl, toUrl] = process.argv;

const SLEEP_TIME = 100;

//  TODO: ALSO NEED TO COMMENT OUT ENCOUNTER LOGIC IN routes/.../patientVaccine
const TOKEN = '';

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
  const { date, ...otherData } = sheetJson;
  const time2 = new Date(Math.round((date - 25569) * 86400 * 1000));
  const timeOfEverything = addMinutesToDate(time2, 5 * 60);
  // console.log(date, time2, timeOfEverything, otherData.patientId);
  return {
    ...otherData,
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

  const hi = data.map(parseSheet).filter(({ patientId }) => patientId !== 'NA');
  console.log('Vaccinations imported!', hi.length);
  return hi;
};

const addMinutesToDate = (initialDate, minutes) => {
  const numberOfMlSeconds = initialDate.getTime();
  const addMlSeconds = minutes * 60 * 1000;
  return new Date(numberOfMlSeconds + addMlSeconds);
};

const postEncounter = async encounterData => {
  const url = `${BASE_URL}/v1/encounter`;
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

const postAdministeredVaccine = async (patientId, vaccinationData) => {
  const url = `${BASE_URL}/v1/patient/${patientId}/administeredVaccine`;
  const response = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(vaccinationData),
  });
  if (!response.ok) {
    console.warn(`  -x ERROR: ${await response.text()}`);
    throw new Error('oop 2');
  }
  return response.json();
};

const dose1AZ = 'f1722cb8-7eb1-4127-aba4-eccfff867117';
const dose2AZ = 'ab780935-84d9-4114-bd4b-e8b6329cff74';

const INJECTION_SITE_MAP = {
  0: undefined,
  1: 'Left arm',
  2: 'Right arm',
};

const adminUserId = 'f16eece5-83e3-4935-ba84-14fefd2a46a7'; // Tamanu admin

function mapToRecordData(data) {
  const { patientId, shotNumber, administeredBy, batch, injectionSite, timeOfEverything } = data;

  const encounterData = {
    id: uuidv4(),
    patientId,
    encounterType: ENCOUNTER_TYPES.CLINIC,
    departmentId: 'department-Outpatients',
    locationId: 'location-Outreach',
    deviceId: 'manual_import',
    reasonForEncounter: 'Imported Vaccination',
    examinerId: adminUserId,
    startDate: timeOfEverything,
    endDate: addMinutesToDate(timeOfEverything, 60),
  };

  const administeredVaccineData = {
    id: uuidv4(),
    encounterId: encounterData.id,
    batch,
    status: VACCINE_STATUS.GIVEN,
    // reason: `Given by: ${administeredBy}`,
    date: addMinutesToDate(timeOfEverything, 10),
    scheduledVaccineId: shotNumber === 1 ? dose1AZ : dose2AZ,
    injectionSite: INJECTION_SITE_MAP[injectionSite],
  };

  console.log(encounterData);
  console.log(administeredVaccineData);

  return {
    encounterData,
    administeredVaccineData,
  };
}

const BATCH_SIZE = 100;

(async () => {
  const vaccinations = await importExcelSheet();
  const recordsToImport = vaccinations.map(mapToRecordData);

  for (const record of recordsToImport) {
    const { encounterData, administeredVaccineData } = record;
    const { patientId } = encounterData;

    await postEncounter(encounterData);

    await postAdministeredVaccine(patientId, administeredVaccineData);

    await asyncSleep(SLEEP_TIME);
  }
})()
  .then(() => {
    console.log('success!');
  })
  .catch(e => {
    console.error('caught error, stopping...');
    throw e;
  });
