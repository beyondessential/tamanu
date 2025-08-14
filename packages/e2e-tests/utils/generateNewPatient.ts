import { AllPatientsPage } from '../pages/patients/AllPatientsPage';
import { constructFacilityUrl } from './navigation';
import { fakeCreatePatientRequestBody } from '@tamanu/fake-data/fake/fakeRequest/createPatient';

export async function createPatientViaApi(allPatientsPage: AllPatientsPage) {
  const token = await getItemFromLocalStorage(allPatientsPage, 'apiToken');
  const userData = await getCurrentUser(token);
  const currentFacilityId = await getItemFromLocalStorage(allPatientsPage, 'facilityId');

  const patientData = fakeCreatePatientRequestBody({
    required: {
      facilityId: currentFacilityId,
      registeredById: userData.id,
    },
    overrides: {
      patientRegistryType: 'new_patient',
    },
  });

  const apiPatientUrl = constructFacilityUrl(`/api/patient`);

  const response = await fetch(apiPatientUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patientData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create patient: ${response.statusText}`);
  }

  const result = await response.json();
  patientData.id = result.id;

  allPatientsPage.setPatientData(patientData);

  return;
}

export async function getCurrentUser(token: string) {
  const apiUserUrl = constructFacilityUrl(`/api/user/me`);

  const userResponse = await fetch(apiUserUrl, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!userResponse.ok) {
    throw new Error(`Failed to get current user: ${userResponse.statusText}`);
  }

  return userResponse.json();
}

export async function getItemFromLocalStorage(allPatientsPage: AllPatientsPage, item: string) {
  const response = await allPatientsPage.page.evaluate(key => {
    return localStorage.getItem(key);
  }, item);

  if (!response) {
    throw new Error(`No ${item} found in localStorage`);
  }

  return response;
}
