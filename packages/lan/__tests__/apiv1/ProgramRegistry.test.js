import { createDummyPatient, createDummyEncounter } from '@tamanu/shared/demoData/patients';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/shared/test-helpers';
import { createTestContext } from '../utilities';

let baseApp = null;
let models = null;

jest.setTimeout(1000000);
describe('ProgramRegistry', () => {
  let app;

  let testPatient;
  let testEncounter;

  let testProgram;
  let testSurvey;
  let testReferralSurvey;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('admin');

    testPatient = await models.Patient.create(await createDummyPatient(models));
    testEncounter = await models.Encounter.create({
      patientId: testPatient.id,
      ...(await createDummyEncounter(models)),
    });

    testProgram = await models.Program.create(fake(models.Program));
  });
  afterAll(() => ctx.close());
  afterEach(async () => {
    await models.ProgramRegistry.truncate();
  });

  describe('Getting (GET /v1/programRegistry/:id)', () => {
    it('should fetch a survey', async () => {
      const { id } = await models.ProgramRegistry.create({
        ...fake(models.ProgramRegistry),
        name: 'Hepatitis Registry',
        programId: testProgram.id,
      });

      const result = await app.get(`/v1/programRegistry/${id}`);
      expect(result).toHaveSucceeded();

      expect(result.body).toHaveProperty('name', 'Hepatitis Registry');
    });
  });
});
