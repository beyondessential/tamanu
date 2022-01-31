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

const LAB_REQUEST_STATUSES = {
  RECEPTION_PENDING: 'reception_pending',
  RESULTS_PENDING: 'results_pending',
  TO_BE_VERIFIED: 'to_be_verified',
  VERIFIED: 'verified',
  PUBLISHED: 'published',
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

async function asyncSleep(ms) {
  return new Promise(resolve => {
    // // console.log(`sleeping ${ms}ms...`);
    setTimeout(() => resolve(), ms);
  });
}

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

const generateDisplayId = customAlphabet(ALPHABET_FOR_ID, 7);

const addMinutesToDate = (initialDate, minutes) => {
  const numberOfMlSeconds = initialDate.getTime();
  const addMlSeconds = minutes * 60 * 1000;
  return new Date(numberOfMlSeconds + addMlSeconds);
};

const getLabRequests = async () => {
  const data = importExcelSheet();

  const adminUserId = 'user-MHHSTesting'; // constant

  const requests = data.map(({ patientId, positive, timeOfEverything }) => ({
    // Base LabRequest fields
    sampleTime: addMinutesToDate(timeOfEverything, 0),
    requestedDate: addMinutesToDate(timeOfEverything, 60),
    specimenAttached: false,
    status: LAB_REQUEST_STATUSES.PUBLISHED,
    displayId: generateDisplayId(),

    // References
    requestedById: adminUserId,
    labTestCategoryId: 'labTestCategory-COVID',
    labTestPriorityId: positive
      ? 'LabTestPriority-COVIDRapidantigentestpositive'
      : 'LabTestPriority-COVIDRapidantigentestnegative',
    labTestLaboratoryId: 'labTestLaboratory-BelauNationalHospitalLaboratory',

    // Lab tests (importer only)
    labTestTypeIds: [
      positive
        ? 'labTestType-COVIDRapidantigentestpositive'
        : 'labTestType-COVIDRapidantigentestnegative',
    ],

    // not passed to importer
    nonLabRequestFields: {
      patientId,
      userId: adminUserId,
      timeOfEverything,
      testResult: positive ? 'Positive' : 'Negative',
      method: 'labTestMethod-RDT',
    },
  }));
  return requests;
};

const getExistingEncounter = async ({ patientId }) => {
  const url = `${BASE_URL}/v1/patient/${patientId}/encounters`;
  const response = await fetch(url, {
    method: 'GET',
    headers: HEADERS,
  });
  if (!response.ok) {
    console.warn(`  -x ERROR: ${await response.text()}`);
    throw new Error('No existing encounter');
  }
  const encounters = (await response.json()).data;
  // console.log(encounters);
  const matchingEncounters = encounters.filter(
    ({ startDate, encounterType }) =>
      moment(startDate)
        .startOf('day')
        .format('YYYY-MM-DD') === '2022-01-27' && encounterType === 'surveyResponse',
  );

  const abc = encounters.filter(
    ({ startDate, reasonForEncounter }) =>
      moment(startDate)
        .startOf('day')
        .format('YYYY-MM-DD') === '2022-01-27' && reasonForEncounter === 'Lab request from mobile',
  );

  if (abc.length) {
    return false;
  }
  if (matchingEncounters.length === 1) {
    return matchingEncounters[0];
  }

  return false;
};

const getOrCreateEncounter = async options => {
  const a = getExistingEncounter(options);

  if (a === false) {
    // console.log(options.)
    return false;
  }
  // return a;

  // const postData = {
  //   endDate: null,
  //   encounterType: ENCOUNTER_TYPES.CLINIC, // TODO
  //   departmentId: 'department-laboratory',
  //   locationId: 'location-laboratory',
  //   deviceId: 'manual_import',
  //   reasonForEncounter: 'Imported lab request',
  //   ...options,
  // };

  // const url = `${BASE_URL}/v1/encounter`;
  // const response = await fetch(url, {
  //   method: 'POST',
  //   headers: HEADERS,
  //   body: JSON.stringify(postData),
  // });
  // if (!response.ok) {
  //   console.warn(`  -x ERROR: ${await response.text()}`);
  //   throw new Error('oop');
  // }
  // return response.json();
};

const postLabRequest = async labRequestData => {
  const url = `${BASE_URL}/v1/labRequest`;
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

const getLabTests = async labRequestId => {
  const url = `${BASE_URL}/v1/labRequest/${labRequestId}/tests`;
  const response = await fetch(url, {
    method: 'GET',
    headers: HEADERS,
  });
  if (!response.ok) {
    console.warn(`  -x ERROR: ${await response.text()}`);
    throw new Error('oop 3');
  }
  const hi = await response.json();
  // console.log(hi);
  return hi.data;
};

const putLabTest = async (id, labTestData) => {
  const url = `${BASE_URL}/v1/labTest/${id}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(labTestData),
  });
  if (!response.ok) {
    console.warn(`  -x ERROR: ${await response.text()}`);
    throw new Error('oop 3');
  }
  return response.json();
};

async function postEverything(data) {
  const { nonLabRequestFields, ...restOfLabRequest } = data;
  const { patientId, userId, timeOfEverything, testResult, method } = nonLabRequestFields;

  const encounter = await getExistingEncounter({
    patientId,
    examinerId: userId,
    startDate: timeOfEverything,
    endDate: addMinutesToDate(timeOfEverything, 60),
  });

  if (encounter === false) {
    console.log('Skipped!', patientId);
  }
  // return encounter;
  // console.log(encounter);
  // const labRequest = await postLabRequest({
  //   ...restOfLabRequest,
  //   encounterId: encounter.id,
  // });

  // // console.log(labRequest);

  // const labTest = (await getLabTests(labRequest.id))[0];
  // console.log(labTest.id);

  // // console.log(labTest);
  // const test2 = await putLabTest(labTest.id, {
  //   result: testResult,
  //   labTestMethodId: method,
  //   completedDate: addMinutesToDate(timeOfEverything, 120),
  // });

  // console.log(test2);
}

(async () => {
  const labRequests = await getLabRequests();
  for (const labRequest of labRequests) {
    await postEverything(labRequest);
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
