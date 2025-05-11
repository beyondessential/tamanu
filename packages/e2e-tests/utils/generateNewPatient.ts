import { faker } from '@faker-js/faker';
import { AllPatientsPage } from '../pages/patients/AllPatientsPage';

function generateNHN() {
  const letters = faker.string.alpha({ length: 4, casing: 'upper' });
  const numbers = faker.string.numeric(6);
  const generatedId = `${letters}${numbers}`;

  return generatedId;
}

function generatePatientData() {
  const gender = faker.helpers.arrayElement(['male', 'female']);
  const firstName = faker.person.firstName(gender);
  const lastName = faker.person.lastName();
  const dob = faker.date.birthdate({ min: 18, max: 80, mode: 'age' });
  const formattedDOB = dob.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
  const nhn = generateNHN();

  return { firstName, lastName, gender, formattedDOB, nhn };
}

export async function createPatientViaApi(allPatientsPage: AllPatientsPage) {
  const patientData = generatePatientData();
  allPatientsPage.setPatientData(patientData);

  const token = await getItemFromLocalStorage(allPatientsPage, 'apiToken');

  const userData = await getCurrentUser(token);

  const currentFacilityId = await getItemFromLocalStorage(allPatientsPage, 'facilityId');

  const response = await fetch('http://localhost:5173/api/patient', {
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
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create patient: ${response.statusText}`);
  }

  return response.json();
}

async function getCurrentUser(token: string) {
  const userResponse = await fetch('http://localhost:5173/api/user/me', {
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

async function getItemFromLocalStorage(allPatientsPage: AllPatientsPage, item: string) {
  const response = await allPatientsPage.page.evaluate((key) => {
    return localStorage.getItem(key);
  }, item);

  if (!response) {
    throw new Error(`No ${item} found in localStorage`);
  }

  return response;
}
