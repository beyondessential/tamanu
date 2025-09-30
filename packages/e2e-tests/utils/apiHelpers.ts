import { faker } from '@faker-js/faker';
import { request, Page, APIRequestContext } from '@playwright/test';

import { constructFacilityUrl } from './navigation';
import { getItemFromLocalStorage } from './localStorage';
import { Patient, User } from '@tamanu/database';
import { generateNHN } from './generateNewPatient';
import { testData } from './testData';

export const createApiContext = async ({ page }: { page: Page }) => {
  const token = await getItemFromLocalStorage(page, 'apiToken');

  return request.newContext({
    baseURL: constructFacilityUrl('/'),
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getUser = async (api: APIRequestContext): Promise<User> => {
  const userUrl = constructFacilityUrl('/api/user/me');
  const user = await api.get(userUrl);
  return user.json();
};

export const createPatient = async (
  api: APIRequestContext,
  page: Page,
  options: Partial<{
    dateOfBirth: Date;
  }> = {},
): Promise<Patient> => {
  const patientUrl = constructFacilityUrl('/api/patient');

  const facilityId = await getItemFromLocalStorage(page, 'facilityId');
  const user = await getUser(api);

  const patientData = {
    birthFacilityId: null,
    dateOfBirth: options.dateOfBirth || faker.date.birthdate(),
    displayId: generateNHN(),
    facilityId,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    patientRegistryType: 'new_patient',
    registeredById: user.id,
    sex: faker.person.sex(),
    villageId: testData.villageId,
    culturalName: faker.person.middleName(),
  };

  const response = await api.post(patientUrl, {
    data: patientData,
  });


  return response.json();
};

// TODO: swap these functions to use the new fakeRequests in fakeData package when it's merged
export const createHospitalAdmissionEncounterViaAPI = async (
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
) => {
  const encounterUrl = constructFacilityUrl('/api/encounter');
  const user = await getUser(api);


  const encounterData = {
    departmentId: testData.departmentId,
    encounterType: testData.encounterType,
    examinerId: user.id,
    locationId: testData.locationId,
    patientBillingTypeId: testData.patientBillingTypeId,
    patientId: testData.patientId || patientId  ,
    startDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
    ...overrides,
    dietIds: JSON.stringify(['diet-Carb-Controlled', 'diet-Citrusfree']),
  };

  const response = await api.post(encounterUrl, {
    data: encounterData,
  });

  if (!response.ok()) {
    const errorText = await response.text();
    console.error('Failed to create hospital admission encounter:', response.status(), errorText);
    throw new Error(
      `Failed to create hospital admission encounter: ${response.status()} ${errorText}`,
    );
  }

  return response.json();
};
// TODO: swap these functions to use the new fakeRequests in fakeData package when it's merged
export const createTriageEncounterViaApi = async (
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
    vitals: any;
  }> = {},
) => {
  const triageUrl = constructFacilityUrl('/api/triage');
  const user = await getUser(api);
  const facilityId = await getItemFromLocalStorage(page, 'facilityId');

  const triageData = {
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
  };

  const response = await api.post(triageUrl, {
    data: triageData,
  });

  if (!response.ok()) {
    const errorText = await response.text();
    console.error('Failed to create triage encounter:', response.status(), errorText);
    throw new Error(`Failed to create triage encounter: ${response.status()} ${errorText}`);
  }

  return response.json();
};
// TODO: swap these functions to use the new fakeRequests in fakeData package when it's merged
export const createClinicEncounterViaApi = async (
  api: APIRequestContext,
  patientId: string,
  overrides: Partial<{
    departmentId: string;
    encounterType: string;
    examinerId: string;
    locationId: string;
    startDate: string;
  }> = {},
) => {
  const encounterUrl = constructFacilityUrl('/api/encounter');
  const user = await getUser(api);

  const encounterData = {
    departmentId: testData.departmentId,
    encounterType: 'clinic',
    examinerId: user.id,
    locationId: testData.locationId,
    patientId,
    startDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
    ...overrides,
  };

  const response = await api.post(encounterUrl, {
    data: encounterData,
  });

  if (!response.ok()) {
    const errorText = await response.text();
    console.error('Failed to create clinic encounter:', response.status(), errorText);
    throw new Error(`Failed to create clinic encounter: ${response.status()} ${errorText}`);
  }

  return response.json();
};

export const recordPatientDeathViaApi = async (
  api: APIRequestContext,
  page: Page,
  patientId: string,
) => {
  const facilityId = await getItemFromLocalStorage(page, 'facilityId');
  const user = await getUser(api);

  // Verify patient exists first
  const verifyPatientUrl = constructFacilityUrl(`/api/patient/${patientId}`);

  const verifyResponse = await api.get(verifyPatientUrl);

  if (!verifyResponse.ok()) {
    throw new Error(`Patient ${patientId} not found. Please ensure patient is created first.`);
  }

  const apiDeathUrl = constructFacilityUrl(`/api/patient/${patientId}/death`);

  const deathData = {
    clinicianId: user.id,
    facilityId,
    timeOfDeath: new Date().toISOString(),
    manner: 'Disease',
    outsideHealthFacility: false,
    isPartialWorkflow: true,
  };

  const response = await api.post(apiDeathUrl, {
    data: deathData,
  });

  if (!response.ok()) {
    const responseText = await response.text();
    console.error('Response status:', response.status());
    console.error('Response text:', responseText);
    throw new Error(`Failed to record patient death: ${response.statusText()} - ${responseText}`);
  }

  return response.json();
};
