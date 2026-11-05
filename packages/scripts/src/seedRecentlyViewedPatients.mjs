/* eslint-disable no-console */
import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

// Gives the admin user a few recently viewed patients on each facility of an autodeploy, so the
// patient listing doesn't open bare. The list is per facility and never syncs, so each facility
// is seeded through its own API, once the provisioned patients have synced down to it.
// Usage: node seedRecentlyViewedPatients.mjs <deploy name> <facility count>

const PATIENT_COUNT = 5;
const WAIT_FOR_PATIENTS_MS = 20 * 60 * 1000;
const POLL_MS = 15 * 1000;

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

async function seedFacility(facilityNumber) {
  const facilityId = `facility-${facilityNumber}`;
  const api = `https://${facilityId}.${deployName}.cd.tamanu.app/api`;
  const deadline = Date.now() + WAIT_FOR_PATIENTS_MS;

  while (Date.now() < deadline) {
    try {
      const { token } = await request(`${api}/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'admin@tamanu.io',
          password: 'admin',
          deviceId: 'cd-seed-recently-viewed',
          facilityId,
        }),
      });
      const authorised = { ...headers, authorization: `Bearer ${token}` };
      const { data: patients } = await request(
        `${api}/patient?facilityId=${facilityId}&isAllPatientsListing=true&rowsPerPage=${PATIENT_COUNT}`,
        { headers: authorised },
      );
      if (patients.length > 0) {
        for (const { id } of patients) {
          await request(`${api}/user/recently-viewed-patients/${id}`, {
            method: 'POST',
            headers: authorised,
          });
        }
        console.log(`${facilityId}: seeded ${patients.length} recently viewed patients`);
        return;
      }
      console.log(`${facilityId}: no patients synced yet`);
    } catch (error) {
      console.log(`${facilityId}: not ready (${error.message})`);
    }
    await sleep(POLL_MS);
  }
  throw new Error(
    `${facilityId}: no patients to seed after ${WAIT_FOR_PATIENTS_MS / 60000} minutes`,
  );
}

const facilityNumbers = Array.from({ length: Number(facilityCount) }, (_, index) => index + 1);
const results = await Promise.allSettled(facilityNumbers.map(seedFacility));
const failures = results.filter(({ status }) => status === 'rejected');
for (const { reason } of failures) console.error(reason.message);
if (failures.length > 0) process.exit(1);
