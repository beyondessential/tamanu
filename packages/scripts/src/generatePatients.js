
const { customAlphabet } = require('nanoid');
const _ = require('lodash');
const fetch = require('node-fetch');

export const ALPHABET_FOR_ID =
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

async function asyncSleep(ms) {
  return new Promise(resolve => {
    console.log(`sleeping ${ms}ms...`);
    setTimeout(() => resolve(), ms);
  });
}

const generateDisplayId = () => {
  return customAlphabet(ALPHABET_FOR_ID, 7)
}

const addMinutesToDate = (initialDate, minutes) => {
  const numberOfMlSeconds = initialDate.getTime();
  const addMlSeconds = minutes * 60 * 1000;
  return new Date(numberOfMlSeconds + addMlSeconds);
}

const getLabRequests = async () => {
  const timeOfEverything = new Date(2022, 1, 27) // replace with date of form +1h
  const requests = [
    {
      sampleTime: addMinutesToDate(timeOfEverything, 0),
      requestedDate: addMinutesToDate(timeOfEverything, 60),
      specimenAttached: false,
      urgent: false,
      status: LAB_REQUEST_STATUSES.PUBLISHED,
      senaiteId: null,
      sampleId: null,
      displayId: generateDisplayId(),
    }
  ];
  return requests;
}

async function postLabRequest(labRequest) {
    const url = `${BASE_URL}/v1/labRequest`;
    const response = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(labRequest),
    });
    if (!response.ok) {
      console.warn(`  -x ERROR: ${await response.text()}`);
    }
  }
}

(async () => {
  const labRequests = await getLabRequests();

  for (const labRequest of labRequests) {
    await postLabRequest(labRequest)
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
