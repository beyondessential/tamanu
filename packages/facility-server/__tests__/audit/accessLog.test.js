import config from 'config';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { version } from '../../package.json';

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

  it('create an AccessLog with appropriate details when a user hits the basic patient get endpoint', async () => {
    const endpoint = `/api/patient/${patient.id}?facilityId=${facilityId}`;

    const response = await userApp.get(endpoint);
    expect(response).toHaveSucceeded();

    const accessLogs = await models.AccessLog.findAll();
    expect(accessLogs.length).toBe(1);
    const log = accessLogs[0];
    expect(log.frontEndContext).toMatchObject({ id: patient.id });
    expect(log.backEndContext).toMatchObject({ endpoint });
    expect(log.userId).toBe(userApp.user.id);
    expect(log.recordId).toBe(patient.id);
    expect(log.recordType).toBe('Patient');
    expect(log.facilityId).toBe(facilityId);
    expect(log.isMobile).toBe(false);
    expect(log.version).toBe(version);
    expect(log.sessionId).toBeDefined();
  });
});
