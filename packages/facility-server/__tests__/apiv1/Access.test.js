import config from 'config';
import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { createTestContext } from '../utilities';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

describe('AccessLog', () => {
  const [facilityId] = selectFacilityIds(config);
  let patient = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(createDummyPatient(models));
  });
  afterAll(() => ctx.close());

  it('should record a patient view log with appropriate details', async () => {
    const testUrl = `/api/patient/${patient.id}`;
    await app.get(testUrl);
    const AccessLogs = await models.AccessLog.findAll({ raw: true });

    expect(AccessLogs).toHaveLength(1);
    const testLog = AccessLogs[0];

    expect(testLog).toMatchObject({
      recordId: patient.id,
      recordType: 'Patient',
      userId: app.user.id,
      facilityId,
    });
  });
});
