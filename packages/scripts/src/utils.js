const fetch = require('node-fetch');

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  Accepts: 'application/json',
};
const getHeaders = async baseUrl => ({
  Authorization: `Bearer ${await getToken(baseUrl)}`,
  ...BASE_HEADERS,
});

const getToken = async baseUrl => {
  const loginResponse = await login(baseUrl);
  return loginResponse.token;
};

const login = async baseUrl => {
  const url = `${baseUrl}/v1/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({
      email: 'admin@tamanu.io',
      password: '',
    }),
  });
  if (!response.ok) {
    throw new Error(`Problem logging in to ${baseUrl}!`);
  }
  return response.json();
};

const ALPHABET_FOR_ID =
  // this is absolutely fine and the concat isn't useless
  // eslint-disable-next-line no-useless-concat
  'ABCDEFGH' + /* I */ 'JK' + /* L */ 'MN' + /* O */ 'PQRSTUVWXYZ' + /* 01 */ '23456789';

const SLEEP_TIME = 100;

const addMinutesToDate = (initialDate, minutes) => {
  const numberOfMlSeconds = initialDate.getTime();
  const addMlSeconds = minutes * 60 * 1000;
  return new Date(numberOfMlSeconds + addMlSeconds);
};

const generateDisplayId = customAlphabet(ALPHABET_FOR_ID, 7);

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
    // // console.log(`sleeping ${ms}ms...`);
    setTimeout(() => resolve(), ms);
  });
}

module.exports = {
  getHeaders,
  addMinutesToDate,
  generateDisplayId,
  LAB_REQUEST_STATUSES,
};
