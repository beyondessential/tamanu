const { customAlphabet } = require('nanoid');
const { v4: uuidv4 } = require('uuid');
const { readFile, utils } = require('xlsx');
const moment = require('moment');
const _ = require('lodash');
const fetch = require('node-fetch');
const {
  getHeaders,
  addMinutesToDate,
  generateDisplayId,
  LAB_REQUEST_STATUSES,
} = require('./utils');

const BASE_URL = 'https://sync-dev.tamanu.io';

const FILE =
  '/mnt/c/Users/locke/Data/BE/Data/Tamanu/Samoa data import 11-04-2022/Matched by Nikita/To be imported.xlsx';

const parseSheet = sheetJson => {
  const { patientId, result, date, isolationVillage, phone, source } = sheetJson;
  const time2 = new Date(Math.round((date - 25569) * 86400 * 1000));
  const timeOfEverything = addMinutesToDate(time2, 60);
  console.log(date, time2, timeOfEverything);
  return {
    patientId,
    positive: result === 'Positive',
    // Months are 0 indexed??
    timeOfEverything,
    isolationVillage,
    phone,
    source,
  };
};

const importExcelSheet = () => {
  const workbook = readFile(FILE);
  const worksheet = workbook.Sheets.hi;
  const data = utils.sheet_to_json(worksheet);

  console.log(data);
  const hi = data.map(parseSheet);
  console.log(hi);
  return hi;
};

const getLabRequests = async () => {
  const data = importExcelSheet();

  const adminUserId = 'b5ee86e8-23a2-4c1a-be15-0bbb3aaef047'; // Initial Admin

  const requests = {
    records: data.map(({ patientId, positive, timeOfEverything }) => {
      const encounterId = uuidv4();
      const labRequestId = uuidv4();
      const surveyResponseId = uuidv4();

      return {
        data: {
          id: encounterId,
          patientId,
          userId: adminUserId,
          endDate: null,
          encounterType: ENCOUNTER_TYPES.CLINIC, // TODO
          departmentId: 'location-GeneralClinic',
          locationId: 'department-GeneralClinic',
          deviceId: 'manual_import',
          reasonForEncounter: 'Imported lab request',

          labRequests: [
            {
              data: {
                // Base LabRequest fields
                id: labRequestId,
                sampleTime: addMinutesToDate(timeOfEverything, 0),
                requestedDate: addMinutesToDate(timeOfEverything, 60),
                specimenAttached: false,
                status: LAB_REQUEST_STATUSES.PUBLISHED,
                displayId: generateDisplayId(),

                // References
                encounterId,
                requestedById: adminUserId,
                labTestCategoryId: 'labTestCategory-COVIDRAT',
                labTestPriorityId: null,
                labTestLaboratoryId: null,

                labTests: [
                  {
                    labRequestId,
                    labTestTypeId: positive
                      ? 'labTestType-COVIDRapidantigentestpositive'
                      : 'labTestType-COVIDRapidantigentestnegative',
                    labTestMethodId: 'labTestMethod-RDT',
                    result: positive ? 'Positive' : 'Negative',
                    // status: 'reception_pending' is default
                    date: addMinutesToDate(timeOfEverything, 90), // Dates are all over the place in the db...
                  },
                ],
              },
            },
          ],
          surveyResponses: [
            {
              data: {
                id: surveyResponseId,
                encounterId,
                answers: [
                  {
                    // NEED TO FILL WITH INFO
                    data: {
                      // id: uuidv4(),
                      responseId: surveyResponseId,
                    },
                  },
                ],
              },
            },
          ],
        },
      };
    }),
  };
  return requests;
};

async function postEverything(data) {
  const { nonLabRequestFields, ...restOfLabRequest } = data;
  const { patientId, userId, timeOfEverything, testResult, method } = nonLabRequestFields;

  const encounter = await createEncounter({
    patientId,
    examinerId: userId,
    startDate: timeOfEverything,
    endDate: addMinutesToDate(timeOfEverything, 60),
  });

  console.log(encounter);
  const labRequest = await postLabRequest({
    ...restOfLabRequest,
    encounterId: encounter.id,
  });

  // console.log(labRequest);

  const labTest = (await getLabTests(labRequest.id))[0];
  console.log(labTest.id);

  // console.log(labTest);
  const test2 = await putLabTest(labTest.id, {
    result: testResult,
    labTestMethodId: method,
    completedDate: addMinutesToDate(timeOfEverything, 120),
    date: addMinutesToDate(timeOfEverything, 120),
  });

  console.log(test2);
}

(async () => {
  const headers = await getHeaders(BASE_URL);
  const labRequests = await getLabRequests();
  console.log(labRequests);
  // for (const labRequest of labRequests) {
  //   await postEverything(labRequest);
  //   await asyncSleep(SLEEP_TIME);
  // }
})()
  .then(() => {
    console.log('success!');
  })
  .catch(e => {
    console.error('caught error, stopping...');
    throw e;
  });
