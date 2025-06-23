import { faker } from '@faker-js/faker';
import { request, Page, APIRequestContext } from '@playwright/test';

import { constructFacilityUrl } from './navigation';
import { getItemFromLocalStorage } from './localStorage';
import { Patient, User } from '@tamanu/database';
import { generateNHN } from './generateNewPatient';

export const createApiContext = async ({ page }: { page: Page }) => {
  const token = await getItemFromLocalStorage(page, 'apiToken');

  return request.newContext({
    baseURL: constructFacilityUrl('/'),
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const getUser = async (api: APIRequestContext): Promise<User> => {
  const userUrl = constructFacilityUrl('/api/user');
  const user = await api.get(userUrl);
  return user.json();
};

export const createPatient = async (api: APIRequestContext, page: Page): Promise<Patient> => {
  const patientUrl = constructFacilityUrl('/api/patient');

  const facilityId = await getItemFromLocalStorage(page, 'facilityId');
  const user = await getUser(api);

  const patientData = {
    birthFacilityId: null,
    dateOfBirth: faker.date.birthdate(),
    displayId: generateNHN(),
    facilityId,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    patientRegistryType: 'new_patient',
    registeredById: user.id,
    sex: faker.person.sex(),
  };

  const response = await api.post(patientUrl, {
    data: patientData,
  });

  return response.json();
};
