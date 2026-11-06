/* eslint-disable no-console */
import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

// Gives the admin user a few recently viewed patients on each facility of an autodeploy, so the
// patient listing doesn't open bare. The list is per facility and never syncs, so each facility
// is seeded through its own API, once its first sync has brought the provisioned patients down.
// Usage: node seedRecentlyViewedPatients.mjs <deploy name> <facility count>

const PATIENT_COUNT = 5;
const WAIT_FOR_FIRST_SYNC_MS = 20 * 60 * 1000;
const POLL_MS = 15 * 1000;
const SEED_ATTEMPTS = 5;

const [deployName, facilityCount] = process.argv.slice(2);
const { version } = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url)));
const headers = {
  'content-type': 'application/json',
  'x-tamanu-client': 'Tamanu Desktop',
  'x-version': version,
};

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${options?.method ?? 'GET'} ${url}: ${response.status}`);
  return response.json();
}

// A facility login writes the user's row locally, which restarts any sync in progress, so the
// wait polls the unauthenticated ping and logs in only once the first sync has finished.
async function waitForFirstSync(api, facilityId) {
  const deadline = Date.now() + WAIT_FOR_FIRST_SYNC_MS;
  let lastProblem = 'still setting up';
  while (Date.now() < deadline) {
    try {
      const { isSettingUp } = await request(`${api}/public/ping`);
      if (!isSettingUp) return;
      lastProblem = 'still setting up';
    } catch (error) {
      lastProblem = error.message;
    }
    console.log(`${facilityId}: not ready (${lastProblem})`);
    await sleep(POLL_MS);
  }
  throw new Error(
    `${facilityId}: gave up after ${WAIT_FOR_FIRST_SYNC_MS / 60000} minutes (${lastProblem})`,
  );
}

async function recordRecentlyViewed(api, facilityId) {
  const { token } = await request(`${api}/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: 'admin@tamanu.io',
      password: 'admin',
      deviceId: 'cd-seed-recently-viewed',
    }),
  });
  const authorised = { ...headers, authorization: `Bearer ${token}` };
  const { data: patients } = await request(
    `${api}/patient?facilityId=${facilityId}&isAllPatientsListing=true&rowsPerPage=${PATIENT_COUNT}`,
    { headers: authorised },
  );
  if (patients.length === 0) throw new Error('no patients to seed after first sync');
  for (const { id } of patients) {
    await request(`${api}/user/recently-viewed-patients/${id}`, {
      method: 'POST',
      headers: authorised,
    });
  }
  return patients.length;
}

async function seedFacility(facilityNumber) {
  const facilityId = `facility-${facilityNumber}`;
  const api = `https://${facilityId}.${deployName}.cd.tamanu.app/api`;
  await waitForFirstSync(api, facilityId);

  // Logins can be refused for a short while after the first sync finishes.
  for (let attempt = 1; ; attempt++) {
    try {
      const seeded = await recordRecentlyViewed(api, facilityId);
      console.log(`${facilityId}: seeded ${seeded} recently viewed patients`);
      return;
    } catch (error) {
      if (attempt === SEED_ATTEMPTS) throw new Error(`${facilityId}: ${error.message}`);
      console.log(`${facilityId}: seeding failed, retrying (${error.message})`);
      await sleep(POLL_MS);
    }
  }
}

const facilityNumbers = Array.from({ length: Number(facilityCount) }, (_, index) => index + 1);
const results = await Promise.allSettled(facilityNumbers.map(seedFacility));
const failures = results.filter(({ status }) => status === 'rejected');
for (const { reason } of failures) console.error(reason.message);
if (failures.length > 0) process.exit(1);
