const { customAlphabet } = require('nanoid');
const { readFile, utils } = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Chance = require('chance');
const _ = require('lodash');
const fetch = require('node-fetch');
const {
  createDummyPatient,
  createDummyPatientAdditionalData,
  createDummyEncounter,
  randomDate,
} = require('../../shared/demoData');
const { getHeaders } = require('./utils');

const chance = new Chance();

const ALPHABET_FOR_ID =
  // this is absolutely fine and the concat isn't useless
  // eslint-disable-next-line no-useless-concat
  'ABCDEFGH' + /* I */ 'JK' + /* L */ 'MN' + /* O */ 'PQRSTUVWXYZ' + /* 01 */ '23456789';

const BASE_URL = 'https://sync-uat-fiji-vps.tamanu.io';

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

const asyncSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const mergeValuesByKey = objects => {
  const pairs = _.flatMap(objects, _.toPairs); // get an array of pairs
  const groups = _.groupBy(pairs, _.head); // group them by the key

  return _.mapValues(groups, g => g.map(_.last)); // map each group to an array of values
};

const generateDisplayId = customAlphabet(ALPHABET_FOR_ID, 7);

const addMinutesToDate = (initialDate, minutes) => {
  const numberOfMlSeconds = initialDate.getTime();
  const addMlSeconds = minutes * 60 * 1000;
  return new Date(numberOfMlSeconds + addMlSeconds);
};

const postPatientData = async (headers, endpoint, data) => {
  for (const dataPoint of data) {
    const { patientId } = dataPoint;
    await postData(headers, `patient%2F${patientId}%2F${endpoint}`, [dataPoint]);
    await asyncSleep(100);
  }
};

const postData = async (headers, endpoint, data) => {
  console.log(endpoint);
  const url = `${BASE_URL}/v1/sync/${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data.map(a => ({ data: a }))),
  });
  if (!response.ok) {
    console.warn(`  -x ERROR: ${await response.text()}`);
    throw new Error('oop 2');
  }
  return response.json();
};

async function postEverything(headers, data) {
  const { patient, patientAdditionalData, encounter, labRequest, labTest } = data;

  await postData(headers, 'patient', patient);
  await postPatientData(headers, 'additionalData', patientAdditionalData);
  await postPatientData(headers, 'encounter', encounter);
}

const fakeFunc = () => {};

const FAKE_MODELS = {
  Location: {
    findOne: fakeFunc,
  },
  Department: {
    findOne: fakeFunc,
  },
  User: {
    findOne: fakeFunc,
  },
  ReferenceData: {
    sequelize: { random: fakeFunc },
  },
};

const LAB_REQUEST_STATUS_OPTIONS = [
  LAB_REQUEST_STATUSES.PUBLISHED,
  LAB_REQUEST_STATUSES.PUBLISHED,
  LAB_REQUEST_STATUSES.PUBLISHED,
  LAB_REQUEST_STATUSES.RECEPTION_PENDING,
  'deleted',
];

const LAB_IDS = [
  'labTestLaboratory-CWMHospital',
  'labTestLaboratory-FijiCDC',
  'labTestLaboratory-LabasaHospital',
  'labTestLaboratory-LautokaHospital',
  'labTestLaboratory-NadiHospital',
  'labTestLaboratory-TwomeyHospital',
];

const SWAB_TYPE_IDS = [
  'labTestType-COVID19NasalSwab',
  'labTestType-COVIDNasopharyngealSwab',
  'labTestType-COVIDOropharyngealSwab',
  'labTestType-COVIDEndotrachealaspirate',
];
const LAB_TEST_METHOD_IDS = ['labTestMethod-GeneXpert', 'labTestMethod-RTPCR'];

const USER_OPTIONS = [
  'users-Doctor',
  'b5ee86e8-23a2-4c1a-be15-0bbb3aaef047',
  'edd1705d-2478-4a37-b192-076cea6ee545',
];

const getOneFakeData = async displayId => {
  const timeOfEverything = randomDate();
  const PCRFields = {
    labTestLaboratoryId: chance.pickone(LAB_IDS),
    labTestMethodId: chance.pickone(LAB_TEST_METHOD_IDS),
    labTestTypeId: chance.pickone(SWAB_TYPE_IDS),
  };
  const { labTestLaboratoryId, labTestMethodId, labTestTypeId, result } = chance.pickone([
    {
      // posRDT
      labTestLaboratoryId: null,
      labTestMethodId: 'labTestMethod-RDT',
      labTestTypeId: 'labTestType-RDTPositive',
      result: 'Positive',
    },
    {
      // negRDT
      labTestLaboratoryId: null,
      labTestMethodId: 'labTestMethod-RDT',
      labTestTypeId: 'labTestType-RDTNegativenofurthertestingneeded',
      result: 'Negative',
    },
    {
      // posPCR
      ...PCRFields,
      result: 'Positive',
    },
    {
      // negPCR
      ...PCRFields,
      result: 'Negative',
    },
  ]);
  const userId = chance.pickone(USER_OPTIONS);

  const patient = {
    ...(await createDummyPatient()),
    id: uuidv4(),
    displayId,
  };
  const patientAdditionalData = {
    ...(await createDummyPatientAdditionalData()),
    id: uuidv4(),
    patientId: patient.id,
  };
  const encounter = {
    ...(await createDummyEncounter(FAKE_MODELS)),
    id: uuidv4(),
    patientId: patient.id,

    encounterType: ENCOUNTER_TYPES.CLINIC,
    departmentId: 'department-GeneralMedicine',
    locationId: 'location-ClinicalTreatmentRoom',
    examinerId: userId,
    // deviceId: 'TODO',
  };
  const labRequest = {
    id: uuidv4(),
    encounterId: encounter.id,

    // Data fields
    sampleTime: addMinutesToDate(timeOfEverything, 0),
    requestedDate: addMinutesToDate(timeOfEverything, 60),
    specimenAttached: false,
    status: chance.pickone(LAB_REQUEST_STATUS_OPTIONS),
    displayId: generateDisplayId(),

    // References
    requestedById: userId,
    labTestCategoryId: 'labTestCategory-COVID',
    // eslint-disable-next-line no-nested-ternary
    // labTestPriorityId: 'TODO',
    labTestLaboratoryId,
  };
  const labTest = {
    id: uuidv4(),
    labRequestId: labRequest.id,

    // Data fields
    result,
    labTestTypeId,
    labTestMethodId,
    categoryId: labRequest.labTestCategoryId, // why is this needed?
    completedDate: addMinutesToDate(timeOfEverything, 120),
    date: addMinutesToDate(timeOfEverything, 120),
    // laboratoryOfficer: 'TODO',
  };

  return {
    patient,
    patientAdditionalData,
    encounter: {
      ...encounter,
      labRequests: [
        {
          data: {
            ...labRequest,
            tests: [{ data: labTest }],
          },
        },
      ],
    },
  };
};

const PATIENT_DISPLAY_IDS = [
  '2021051400',
  '2021034420',
  '2021493663',
  '2021771699',
  '2021817066',
  '2021319334',
  '2021168955',
  '2021648310',
  '2021809927',
  '2021173392',
  '2021349118',
  '2021218590',
  '2021598506',
  '2021519348',
  '2021103737',
  '2021135164',
  '2021483653',
  '2021795649',
  '2021767431',
  '2021300957',
  '2021408671',
  '2021516308',
  '2021783014',
  '2021715094',
  '2021274136',
  '2021001596',
  '2021563318',
  '2021146233',
  '2021693846',
  '2021111045',
  '2021417376',
  '2021320731',
  '2021399889',
  '2021286602',
  '2021354522',
  '2021661022',
  '2021541901',
  '2021023182',
  '2021793024',
  '2021513852',
  '2021815838',
  '2021842244',
  '2021767093',
  '2021852669',
  '2021731490',
  '2021846512',
  '2021858978',
  '2021790491',
  '2021860452',
  '2021845945',
  '2021670371',
  '2021840847',
  '2021726993',
];

(async () => {
  const headers = await getHeaders(BASE_URL);
  const data = await Promise.all(PATIENT_DISPLAY_IDS.map(getOneFakeData));
  console.log(data);
  if (!data.length) throw new Error('No data!');
  const dataByType = mergeValuesByKey(data);
  console.log(headers, dataByType);
  await postEverything(headers, dataByType);
})()
  .then(() => {
    console.log('success!');
  })
  .catch(e => {
    console.error('caught error, stopping...');
    throw e;
  });
