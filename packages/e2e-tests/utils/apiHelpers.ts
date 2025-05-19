import { faker } from '@faker-js/faker';
import { request, Page, APIRequestContext } from '@playwright/test';

import { constructFacilityUrl } from './navigation';
import { getItemFromLocalStorage } from './localStorage';
import { User } from '@tamanu/database';

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

export const createPatient = async (api: APIRequestContext, page: Page) => {
  const patientUrl = constructFacilityUrl('/api/patient');

  const facilityId = await getItemFromLocalStorage(page, 'facilityId');
  const user = await getUser(api);

  const patientData = {
    birthFacilityId: null,
    dateOfBirth: faker.date.birthdate(),
    displayId: faker.string.uuid(),
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
