import { faker } from '@faker-js/faker';
import { AllPatientsPage } from '../pages/patients/AllPatientsPage';
import { constructFacilityUrl } from './navigation';
import { testData } from '../utils/testData';

export function generateNHN() {
  const letters = faker.string.alpha({ length: 4, casing: 'upper' });
  const numbers = faker.string.numeric(6);
  const generatedId = `${letters}${numbers}`;

  return generatedId;
}

// TODO: Refactor to use `fake-data` when importing is workings
function generatePatientData() {
  const gender = faker.helpers.arrayElement(['male', 'female']);
  const firstName = faker.person.firstName(gender);
  const lastName = faker.person.lastName();
  const dob = faker.date.birthdate({ min: 0, max: 95, mode: 'age' });
  const formattedDOB = dob.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
  const nhn = generateNHN();
  const culturalName = faker.person.middleName(gender);
  const village = testData.village;
  return { firstName, lastName, gender, formattedDOB, nhn, culturalName, village, id: '' };
}

//TODO: delete this once all tests that use it are refactored to use the new patient fixture
export async function createPatientViaApi(allPatientsPage: AllPatientsPage) {
  const patientData = generatePatientData();
  allPatientsPage.setPatientData(patientData);

  const token = await getItemFromLocalStorage(allPatientsPage, 'apiToken');
  const userData = await getCurrentUser(token);
  const currentFacilityId = await getItemFromLocalStorage(allPatientsPage, 'facilityId');

  const apiPatientUrl = constructFacilityUrl(`/api/patient`);

  const response = await fetch(apiPatientUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      birthFacilityId: null,
      dateOfBirth: patientData.formattedDOB,
      displayId: patientData.nhn,
      facilityId: currentFacilityId,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      patientRegistryType: 'new_patient',
      registeredById: userData.id,
      sex: patientData.gender,
      villageId: testData.villageID,
      culturalName: patientData.culturalName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create patient: ${response.statusText}`);
  }

  const result = await response.json();
  patientData.id = result.id; // Store the ID from response
  allPatientsPage.setPatientData(patientData); // Update patient data with ID
  return result;
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
