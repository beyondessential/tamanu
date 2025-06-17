import { request, Page, APIRequestContext } from '@playwright/test';

import { constructFacilityUrl } from './navigation';
import { getItemFromLocalStorage } from './localStorage';
import { Patient, User } from '@tamanu/database';
import { fakeCreatePatientRequestBody } from '@tamanu/fake-data/fake/fakeRequest/createPatient';

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

  const requestBody = fakeCreatePatientRequestBody({
    facilityId,
    registeredById: user.id,
    patientRegistryType: 'new_patient',
  });

  const response = await api.post(patientUrl, {
    data: requestBody,
  });

  return response.json();
};
