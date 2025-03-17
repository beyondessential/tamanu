import config from 'config';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

describe('accessLog', () => {
  const [facilityId] = selectFacilityIds(config);
  let baseApp;
  let models;
  let userApp;
  let patient;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    userApp = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(fake(models.Patient));
  });

  afterAll(() => ctx.close());

  //   TODO: some are being missed because appropriuate record doesnt exists
  it('create a log with appropriate details when a user hits a patient endpoint', async () => {
    const endpoints = [
      `/api/patient/${patient.id}`,
      `/api/patient/${patient.id}/currentEncounter`,
      `/api/patient/${patient.id}/birthData`,
      `/api/patient/${patient.id}/additionalData`,
      //   `/api/patient/${patient.id}/death`,
      //   `/api/patient/${patient.id}/programRegistration`,
    ];

    for (const endpoint of endpoints) {
      const response = await userApp.get(endpoint, { facilityId });
      expect(response).toHaveSucceeded();
    }

    await new Promise((resolve) => setTimeout(resolve, 4000));

    const accessLogs = await models.AccessLog.findAll();
    expect(accessLogs.length).toBe(endpoints.length);
  });
});
