import config from 'config';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { generateEachDataType } from '@tamanu/fake-data/populateDb';

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
  it('create a log with appropriate details when a user hits the basic patient get endpoint', async () => {
    const endpoint = `/api/patient/${patient.id}`;

    const response = await userApp.get(endpoint, { facilityId });
    expect(response).toHaveSucceeded();

    const accessLogs = await models.AccessLog.findAll();
    expect(accessLogs.length).toBe(1);
    expect(accessLogs[0].backEndContext).toMatchObject({ endpoint });
    expect(accessLogs[0].userId).toBe(userApp.user.id);
    expect(accessLogs[0].recordId).toBe(patient.id);
    expect(accessLogs[0].recordType).toBe('Patient');
  });
});
