import config from 'config';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { version } from '../../package.json';

describe('AccessLog', () => {
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
  });

  beforeEach(async () => {
    // Clean up access logs before each test
    await models.AccessLog.truncate({ cascade: true });
    // Create a fresh patient for each test
    patient = await models.Patient.create(fake(models.Patient));
  });

  afterAll(() => ctx.close());

  describe('GET /api/patient/:id', () => {
    it('should create an AccessLog with appropriate details when accessing a patient', async () => {
      const endpoint = `/api/patient/${patient.id}`;

      const response = await userApp.get(endpoint);
      expect(response).toHaveSucceeded();

      const accessLogs = await models.AccessLog.findAll();
      expect(accessLogs.length).toBe(1);
      const log = accessLogs[0];
      expect(log).toMatchObject({
        frontEndContext: { id: patient.id },
        backEndContext: { endpoint },
        userId: userApp.user.id,
        recordId: patient.id,
        recordType: 'Patient',
        facilityId,
        isMobile: false,
        version,
        sessionId: expect.any(String),
      });
    });

    it('should not create an AccessLog when the request fails', async () => {
      const endpoint = `/api/patient/invalid-id`;

      const response = await userApp.get(endpoint);
      expect(response).toHaveRequestError();

      const accessLogs = await models.AccessLog.findAll();
      expect(accessLogs.length).toBe(0);
    });
  });
});
