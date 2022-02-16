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

  // await postData(headers, 'patient', patient);
  await postPatientData(headers, 'additionalData', patientAdditionalData);
  await postPatientData(headers, 'encounter', encounter);
  // await postData(headers, 'labRequest', labRequest);
  // await postData(headers, 'labTest', labTest);
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

const getOneFakeData = async ({ id, displayId }) => {
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
    id,
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
  // '2021051400', // Just patient
  // '2021034420', // done
  // '2021493663', // done
  { id: '1e5b83fe-ab79-4f7a-ab25-a36266803487', displayId: '2021051400' },
  // {"id": "59e20dc7-e47f-47fa-a046-d8aaec11fe8e",  "displayId": "2021034420"}
  // {"id": "06d4e6f4-16a2-4ee2-9c9c-36d027693d6f",  "displayId": "2021483653"}
  // {"id": "07ed8f81-0035-4b29-acc4-ac8171c40ef4",  "displayId": "2021354522"},
  // {"id": "0f6467c0-ce41-4e70-8138-039ed342d1f8",  "displayId": "2021783014"},
  // {"id": "111c25be-9de5-4b86-9544-c90c5260f334",  "displayId": "2021563318"},
  // {"id": "1410e2c9-d362-4bb9-bf4c-c2eade1ab543",  "displayId": "2021541901"},
  // {"id": "15fb0054-b529-4eec-8a60-f02a8848ca46",  "displayId": "2021408671"},
  // {"id": "173501db-0eb0-4b86-9221-e1af4f6d790f",  "displayId": "2021693846"},
  // {"id": "21a94491-1875-47af-a6e8-a2fb7ee2825d",  "displayId": "2021023182"},
  // {"id": "2aadc4cd-a58c-44bc-a2d6-aa09d1c2f304",  "displayId": "2021286602"},
  // {"id": "2ee1e68b-401e-4eb8-9062-9089a21c5330",  "displayId": "2021319334"},
  // {"id": "2f11945e-88dd-4baa-9a2d-1863ad05fada",  "displayId": "2021173392"},
  // {"id": "302ed1c9-5d55-43cd-a496-cfa1a46c5aa1",  "displayId": "2021715094"},
  // {"id": "337d367d-5436-462a-be74-9981d1d99f9d",  "displayId": "2021349118"},
  // {"id": "40766ec8-deb6-4295-8442-14cac492ff7b",  "displayId": "2021519348"},
  // {"id": "4a2f4fbb-de03-4ea9-b65d-f6d280b22374",  "displayId": "2021817066"},
  // {"id": "4cfd9659-1772-47cf-b4a5-1963316ef665",  "displayId": "2021513852"},
  // {"id": "508b8715-fde5-4fc4-870b-cf0ee3e54471",  "displayId": "2021135164"},
  // {"id": "5234105c-9026-47fb-be9a-bfb742fac2e0",  "displayId": "2021793024"},
  // {"id": "523fb317-6524-4ccc-bed1-9230308c53e3",  "displayId": "2021771699"},
  // {"id": "57ce8204-d286-4520-96d2-d249e3c9f223",  "displayId": "2021815838"},
  // {"id": "587e11cf-ab72-4bbf-bb2a-bc9c56c534cd",  "displayId": "2021670371"},
  // {"id": "58bfe116-deb2-4039-9af6-2c5fafa5b17e",  "displayId": "2021858978"},
  // {"id": "624bceb0-4e69-4e62-9e6f-462fe2273590",  "displayId": "2021274136"},
  // {"id": "65bc59ec-686a-48d8-ad96-8ca98f31d593",  "displayId": "2021218590"},
  // {"id": "686d52b3-1e6f-4f4e-9400-d2410400d821",  "displayId": "2021846512"},
  // {"id": "6b9f0b52-cb79-481a-92e6-e65ca6defa07",  "displayId": "2021840847"},
  // {"id": "7005edda-feff-4ca3-a4b9-f992d01e0b18",  "displayId": "2021726993"},
  // {"id": "708e464b-9e3f-4cd3-ac44-abcc024600c8",  "displayId": "2021001596"},
  // {"id": "779d49dd-5ed7-4726-9338-b8e096aba4db",  "displayId": "2021795649"},
  // {"id": "7ab7f1f7-1dfa-4390-90a3-2b56698c98b2",  "displayId": "2021146233"},
  // {"id": "8180f293-8149-4a3b-8a8b-34ff9c6d5c02",  "displayId": "2021767093"},
  // {"id": "8966f564-26c4-4d59-92d6-05de0d33d95a",  "displayId": "2021648310"},
  // {"id": "8e855158-3f0e-4b2b-ba82-5f0ad5b91f22",  "displayId": "2021417376"},
  // {"id": "9441cd65-e8ed-40b0-b843-7f1a4ae3e6e9",  "displayId": "2021516308"},
  // {"id": "9808894b-1b64-432c-aed0-b6606dfeab4c",  "displayId": "2021845945"},
  // {"id": "9922c261-64a5-4c1a-8e07-681c5e9b72ee",  "displayId": "2021399889"},
  // {"id": "a0fdfb0f-27c0-4b0b-a87b-b3e192cb3ab3",  "displayId": "2021493663"},
  // {"id": "a40f33b6-8d24-4daa-a2b9-f73089557c70",  "displayId": "2021168955"},
  // {"id": "b7f38669-85b1-44e7-a390-3db25edb9884",  "displayId": "2021111045"},
  // {"id": "bb2001c3-8da9-4819-ad3c-021d248126b9",  "displayId": "2021767431"},
  // {"id": "c1435589-7630-4c95-9d43-e2fd0b2b4104",  "displayId": "2021300957"},
  // {"id": "c1cb438d-d699-4484-a59d-41a3177a82f7",  "displayId": "2021809927"},
  // {"id": "c7561790-3113-4917-b045-4f0142c87765",  "displayId": "2021842244"},
  // {"id": "d0bfd99d-a246-47c9-93fb-2686b168a6eb",  "displayId": "2021860452"},
  // {"id": "d3a6a294-ce43-43b7-8f22-b5da8e211fc9",  "displayId": "2021731490"},
  // {"id": "d5d78b3a-92d7-4fcb-9cd4-9df87ccfeee0",  "displayId": "2021103737"},
  // {"id": "d612c8b8-57f5-4059-b8b8-fb5a82546d51",  "displayId": "2021598506"},
  // {"id": "d6293b46-7eea-49f7-ae5a-961e0c4f5816",  "displayId": "2021790491"},
  // {"id": "ec0996ae-2e41-443b-81a2-b62ff78995f0",  "displayId": "2021320731"},
  // {"id": "ed55e2be-6209-430e-ac29-537d02c2262b",  "displayId": "2021852669"},
  // {"id": "f88059f0-ff53-4d84-aff0-4aaf1e94c142",  "displayId": "2021661022"},

  // '2021771699', // patient and patientadditional
  // '2021817066', //
  // '2021319334', //
  // '2021168955',
  // '2021648310',
  // '2021809927',
  // '2021173392',
  // '2021349118',
  // '2021218590',
  // '2021598506',
  // '2021519348',
  // '2021103737',
  // '2021135164',
  // '2021483653',
  // '2021795649',
  // '2021767431',
  // '2021300957',
  // '2021408671',
  // '2021516308',
  // '2021783014',
  // '2021715094',
  // '2021274136',
  // '2021001596',
  // '2021563318',
  // '2021146233',
  // '2021693846',
  // '2021111045',
  // '2021417376',
  // '2021320731',
  // '2021399889',
  // '2021286602',
  // '2021354522',
  // '2021661022',
  // '2021541901',
  // '2021023182',
  // '2021793024',
  // '2021513852',
  // '2021815838',
  // '2021842244',
  // '2021767093',
  // '2021852669',
  // '2021731490',
  // '2021846512',
  // '2021858978',
  // '2021790491',
  // '2021860452',
  // '2021845945',
  // '2021670371',
  // '2021840847',
  // '2021726993',
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
