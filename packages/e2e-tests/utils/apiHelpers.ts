import { faker } from '@faker-js/faker';
import { request, Page, APIRequestContext } from '@playwright/test';

import { constructFacilityUrl, constructAdminUrl } from './navigation';
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
    departmentId: 'department-GeneralMedicine',
    encounterType: 'clinic',
    examinerId: user.id,
    locationId: 'location-EDBed1-tamanu',
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

/**
 * Get the recorded dates for vitals for a given encounter - this is used to find locators for vitals on the vitals pane
 * @param api - The API request context
 * @param encounterId - The encounter ID
 * @returns The recorded dates
 */
export const getVitalsRecordedDates = async (
  api: APIRequestContext,
  encounterId: string,
): Promise<string[]> => {
  const vitalsUrl = constructFacilityUrl(`/api/encounter/${encounterId}/vitals`);

  const response = await api.get(vitalsUrl);

  if (!response.ok()) {
    const errorText = await response.text();
    console.error('Failed to fetch vitals data:', response.status(), errorText);
    throw new Error(`Failed to fetch vitals data: ${response.status()} ${errorText}`);
  }

  const vitalsData = await response.json();

  // Find the date recorded data element (pde-PatientVitalsDate)
  const dateRecord = vitalsData.data.find(
    (record: any) => record.dataElementId === 'pde-PatientVitalsDate',
  );

  if (dateRecord && dateRecord.records) {
    return Object.keys(dateRecord.records);
  } else {
    throw new Error('Date recorded not found');
  }
};

//TODO: make this more generic so other api requests for admin panel can be made easier in future?
export const enableEditVitals = async (page: Page) => {
  const settingsUrl = constructAdminUrl('/api/admin/settings');
  const token = await getItemFromLocalStorage(page, 'apiToken');
  
  const settingsData = {
    settings: {
      'features.enableVitalEdit': true,
    },
    scope: 'global',
  };

  const response = await fetch(settingsUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settingsData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to enable vitals edit:', response.status, errorText);
    throw new Error(`Failed to enable vitals edit: ${response.status} ${errorText}`);
  }

  return response.json();
};
