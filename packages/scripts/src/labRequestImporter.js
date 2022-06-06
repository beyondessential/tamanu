const { v4: uuidv4 } = require('uuid');
const { readFile, utils } = require('xlsx');
const fetch = require('node-fetch');
const {
  getHeaders,
  addMinutesToDate,
  generateDisplayId,
  LAB_REQUEST_STATUSES,
  ENCOUNTER_TYPES,
  asyncSleep,
} = require('./utils');

const BASE_URL = 'https://sync-dev.tamanu.io'; // TOCHANGE

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
  // const adminUserId = 'b5ee86e8-23a2-4c1a-be15-0bbb3aaef047'; // Initial Admin
  const adminUserId = 'dummy-user'; // for dev // TOCHANGE

  return data.map(({ patientId, positive, timeOfEverything, phone, isolationVillage }) => {
    const encounterId = uuidv4();
    const labRequestId = uuidv4();
    const surveyResponseId = uuidv4();

    const answers = [];
    if (phone) {
      answers.push({
        data: {
          // id: uuidv4(),
          dataElementId: 'pde-samcovidsamp02',
          responseId: surveyResponseId,
          body: phone,
        },
      });
    }
    if (isolationVillage) {
      answers.push({
        data: {
          // id: uuidv4(),
          dataElementId: 'pde-samcovidsamp03',
          responseId: surveyResponseId,
          body: `village-${isolationVillage.replace(' ', '')}`,
        },
      });
    }

    return {
      patientId,
      data: [
        {
          data: {
            id: encounterId,
            patientId,
            encounterType: ENCOUNTER_TYPES.CLINIC, // TODO
            locationId: 'location-GeneralClinic',
            departmentId: 'department-GeneralClinic',
            deviceId: 'manual_import',
            reasonForEncounter: 'Imported lab request',
            examinerId: adminUserId,
            startDate: timeOfEverything,
            endDate: addMinutesToDate(timeOfEverything, 60),

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
                  // labTestCategoryId: 'labTestCategory-COVIDRAT', // TOCHANGE
                  labTestCategoryId: 'labTestCategory-COVID',
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
                      completedDate: addMinutesToDate(timeOfEverything, 120),
                      date: addMinutesToDate(timeOfEverything, 120),
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
                  surveyId: 'program-samoacovid19-samcovidsampcollectionv2',
                  startTime: addMinutesToDate(timeOfEverything, -10),
                  endTime: addMinutesToDate(timeOfEverything, -5),
                  answers,
                },
              },
            ],
          },
        },
      ],
    };
  });
};

async function postEverything({ patientId, data }, headers) {
  const response = await fetch(`${BASE_URL}/v1/sync/patient%2F${patientId}%2Fencounter`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  console.log(response);
  console.log(await response.json());
}

(async () => {
  const headers = await getHeaders(BASE_URL);
  const nestedEncounters = await getLabRequests();
  console.log(JSON.stringify(nestedEncounters[0].data, undefined, 2));
  for (const request of nestedEncounters) {
    await postEverything(request, headers);
    await asyncSleep(100);
  }
})()
  .then(() => {
    console.log('success!');
  })
  .catch(e => {
    console.error('caught error, stopping...');
    throw e;
  });
