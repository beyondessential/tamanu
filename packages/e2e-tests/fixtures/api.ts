import { faker } from '@faker-js/faker';
import { APIRequestContext, Page, request } from '@playwright/test';
import { Patient, User } from '@tamanu/database';

import { facilityUrl } from '@helpers/navigation';
import { seeds } from '@data/seeds';

/** Get an auth token from the browser's localStorage. */
async function getToken(page: Page): Promise<string> {
  const state = await page.context().storageState();
  const token = state.origins[0]?.localStorage.find((i) => i.name === 'apiToken')?.value;
  if (!token) throw new Error('No apiToken found in localStorage');
  return token;
}

/** Get a localStorage value by key. */
export async function getLocalStorageItem(page: Page, key: string): Promise<string> {
  const state = await page.context().storageState();
  const val = state.origins[0]?.localStorage.find((i) => i.name === key)?.value;
  if (!val) throw new Error(`No ${key} found in localStorage`);
  return val;
}

/** Create a Playwright API context authenticated with the browser session token. */
export async function createApiContext({ page }: { page: Page }): Promise<APIRequestContext> {
  const token = await getToken(page);
  return request.newContext({
    baseURL: facilityUrl('/'),
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

/** Get the currently authenticated user. */
export async function getUser(api: APIRequestContext): Promise<User> {
  const res = await api.get(facilityUrl('/api/user/me'));
  return res.json();
}

/** Generate a random NHN (4 alpha + 6 numeric). */
export function generateNHN(): string {
  return faker.string.alpha({ length: 4, casing: 'upper' }) + faker.string.numeric(6);
}

/** Create a patient via the API. */
export async function createPatient(
  api: APIRequestContext,
  page: Page,
  options: Partial<{ dateOfBirth: Date }> = {},
): Promise<Patient> {
  const facilityId = await getLocalStorageItem(page, 'facilityId');
  const user = await getUser(api);

  const res = await api.post(facilityUrl('/api/patient'), {
    data: {
      birthFacilityId: null,
      dateOfBirth: options.dateOfBirth || faker.date.birthdate(),
      displayId: generateNHN(),
      facilityId,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      patientRegistryType: 'new_patient',
      registeredById: user.id,
      sex: faker.person.sex(),
      villageId: seeds.villageId,
      culturalName: faker.person.middleName(),
    },
  });

  if (!res.ok()) {
    throw new Error(`Failed to create patient: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/** Create a hospital admission encounter for a patient. */
export async function createHospitalAdmission(
  api: APIRequestContext,
  patientId: string,
  overrides: Partial<{
    departmentId: string;
    encounterType: string;
    examinerId: string;
    locationId: string;
    patientBillingTypeId: string;
    startDate: string;
  }> = {},
): Promise<Record<string, unknown>> {
  const user = await getUser(api);

  const res = await api.post(facilityUrl('/api/encounter'), {
    data: {
      departmentId: seeds.departmentId,
      encounterType: seeds.encounterType,
      examinerId: user.id,
      locationId: seeds.locationId,
      patientBillingTypeId: seeds.patientBillingTypeId,
      patientId,
      startDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      dietIds: JSON.stringify(['diet-Carb-Controlled', 'diet-Citrusfree']),
      ...overrides,
    },
  });

  if (!res.ok()) {
    throw new Error(`Failed to create hospital admission: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/** Create a triage encounter for a patient. */
export async function createTriageEncounter(
  api: APIRequestContext,
  page: Page,
  patientId: string,
  overrides: Partial<{
    chiefComplaintId: string;
    facilityId: string;
    locationId: string;
    practitionerId: string;
    score: string;
    startDate: string;
    triageTime: string;
  }> = {},
): Promise<Record<string, unknown>> {
  const user = await getUser(api);
  const facilityId = await getLocalStorageItem(page, 'facilityId');

  const res = await api.post(facilityUrl('/api/triage'), {
    data: {
      chiefComplaintId: 'triage-Abdominalpaindistension',
      facilityId,
      locationId: 'location-EDBed1-tamanu',
      patientId,
      practitionerId: user.id,
      score: '1',
      startDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      triageTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      vitals: null,
      ...overrides,
    },
  });

  if (!res.ok()) {
    throw new Error(`Failed to create triage encounter: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/** Create a clinic encounter for a patient. */
export async function createClinicEncounter(
  api: APIRequestContext,
  patientId: string,
  overrides: Partial<{
    departmentId: string;
    encounterType: string;
    examinerId: string;
    locationId: string;
    startDate: string;
  }> = {},
): Promise<Record<string, unknown>> {
  const user = await getUser(api);

  const res = await api.post(facilityUrl('/api/encounter'), {
    data: {
      departmentId: seeds.departmentId,
      encounterType: 'clinic',
      examinerId: user.id,
      locationId: seeds.locationId,
      patientId,
      startDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...overrides,
    },
  });

  if (!res.ok()) {
    throw new Error(`Failed to create clinic encounter: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/** Record a patient death via the API. */
export async function recordPatientDeath(
  api: APIRequestContext,
  page: Page,
  patientId: string,
): Promise<Record<string, unknown>> {
  const facilityId = await getLocalStorageItem(page, 'facilityId');
  const user = await getUser(api);

  const res = await api.post(facilityUrl(`/api/patient/${patientId}/death`), {
    data: {
      clinicianId: user.id,
      facilityId,
      timeOfDeath: new Date().toISOString(),
      manner: 'Disease',
      outsideHealthFacility: false,
      isPartialWorkflow: true,
    },
  });

  if (!res.ok()) {
    throw new Error(`Failed to record patient death: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}
