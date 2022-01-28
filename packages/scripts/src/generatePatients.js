const { customAlphabet } = require('nanoid');
const _ = require('lodash');
const fetch = require('node-fetch');

const ALPHABET_FOR_ID =
  // this is absolutely fine and the concat isn't useless
  // eslint-disable-next-line no-useless-concat
  'ABCDEFGH' + /* I */ 'JK' + /* L */ 'MN' + /* O */ 'PQRSTUVWXYZ' + /* 01 */ '23456789';

// const [nodeName, scriptName, fromUrl, toUrl] = process.argv;

const SLEEP_TIME = 100;

const HEADERS = {
  Authorization: 'Bearer fake-token',
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

async function asyncSleep(ms) {
  return new Promise(resolve => {
    console.log(`sleeping ${ms}ms...`);
    setTimeout(() => resolve(), ms);
  });
}

const generateDisplayId = () => {
  return customAlphabet(ALPHABET_FOR_ID, 7);
};

const addMinutesToDate = (initialDate, minutes) => {
  const numberOfMlSeconds = initialDate.getTime();
  const addMlSeconds = minutes * 60 * 1000;
  return new Date(numberOfMlSeconds + addMlSeconds);
};

const mapAnswerToPriority = () => {
  const hi = [
    'LabTestPriority-Inboundtraveller',
    'LabTestPriority-Inout-boundtraveller',
    'LabTestPriority-Outboundtraveller',
    'LabTestPriority-COVIDRapidantigentestpositive',
    'LabTestPriority-COVIDRapidantigentestnegative',
  ];
  return hi[0];
};

const getLabRequests = async () => {
  const timeOfEverything = new Date(2022, 1, 27); // replace with date of form +1h
  const adminUserId = '376d9412-8d94-4f4b-9ff5-7db1b496eb5b';

  const requests = [
    {
      // LabRequest fields
      sampleTime: addMinutesToDate(timeOfEverything, 0),
      requestedDate: addMinutesToDate(timeOfEverything, 60),
      specimenAttached: false,
      urgent: false,
      status: LAB_REQUEST_STATUSES.PUBLISHED,
      senaiteId: null,
      sampleId: null,
      displayId: generateDisplayId(),
      // References
      requestedById: adminUserId,
      categoryId: 'labTestCategory-COVID',
      priorityId: mapAnswerToPriority('a'), // TODO
      laboratoryId: 'labTestLaboratory-BelauNationalHospitalLaboratory',
      // tests
      // Lab tests (importer only)
      labTestTypeIds: [],
      // not passed to importer
      nonLabRequestFields: {
        patientId: '4d719b6f-af55-42ac-99b3-5a27cadaab2b', // TODO - horoto for now
        userId: adminUserId,
        timeOfEverything,
        testResult: 'Negative',
        method: 'labTestMethod-RTPCR',
      },
    },
  ];
  return requests;
};

const test = {
  date: null,
  status: null,
  result: null,
  laboratoryOfficer: null,
  verification: null,
  completedDate: null,
};

const createEncounter = async options => {
  const postData = {
    endDate: null,
    encounterType: ENCOUNTER_TYPES.CLINIC, // TODO
    departmentId: '', // TODO
    locationId: '', // TODO
    deviceId: 'manual_import',
    ...options,
  };

  const url = `${BASE_URL}/v1/encounter`;
  const response = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(postData),
  });
  if (!response.ok) {
    console.warn(`  -x ERROR: ${await response.text()}`);
    throw new Error('oop');
  }
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
};

async function postEverything(labRequest) {
  const { nonLabRequestFields, ...restOfLabRequest } = labRequest;
  const { patientId, userId, timeOfEverything } = nonLabRequestFields;

  const encounter = await createEncounter({
    patient: patientId,
    examiner: userId,
    startDate: timeOfEverything,
    reasonForEncounter: 'Manually imported lab request',
  });

  const labRequest = await postLabRequest({
    ...restOfLabRequest,
    encounterId: encounter.id,
  });

  const { tests } = labRequest;

  console.log(tests);
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
