import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/shared/test-helpers';
import { createTestContext } from '../utilities';

describe('ProgramRegistry', () => {
  let models;
  let app;
  let testProgram;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('practitioner');

    testProgram = await models.Program.create(fake(models.Program));
  });
  afterAll(() => ctx.close());
  afterEach(async () => {
    await models.PatientProgramRegistration.truncate();
    await models.ProgramRegistry.truncate();
    await models.Patient.truncate({ cascade: true });
  });

  describe('Getting (GET /v1/programRegistry/:id)', () => {
    it('should fetch a survey', async () => {
      const { id } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, {
          name: 'Hepatitis Registry',
          programId: testProgram.id,
        }),
      );

      const result = await app.get(`/v1/programRegistry/${id}`);
      expect(result).toHaveSucceeded();

      expect(result.body).toHaveProperty('name', 'Hepatitis Registry');
    });
  });

  describe('Listing (GET /v1/programRegistry)', () => {
    it('should list available program registries', async () => {
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.ProgramRegistry.create(
        ...fake(models.ProgramRegistry, {
          programId: testProgram.id,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
        }),
      );
      await models.ProgramRegistry.create(
        ...fake(models.ProgramRegistry, { programId: testProgram.id }),
      );

      const result = await app.get('/v1/programRegistry');
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(2);
      expect(body.data.length).toEqual(2);
    });

    it('should filter by excludePatientId', async () => {
      const testPatient = await models.Patient.create(fake(models.Patient));

      // Should show:
      await models.ProgramRegistry.create(
        ...fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.ProgramRegistry.create(
        ...fake(models.ProgramRegistry, { programId: testProgram.id }),
      );

      // Should not show (historical):
      await models.ProgramRegistry.create(
        ...fake(models.ProgramRegistry, {
          programId: testProgram.id,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
        }),
      );
      // Should not show (patient already has registration):
      const { id: existingRegistrationId } = await models.ProgramRegistry.create(
        ...fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.PatientProgramRegistration.create(
        ...fake(models.PatientProgramRegistration, {
          patientId: testPatient.id,
          programRegistryId: existingRegistrationId,
        }),
      );

      const result = await app
        .get('/v1/programRegistry')
        .query({ excludePatientId: testPatient.id });
      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toBe(2);
    });

    it('should escape the excludePatientId parameter', async () => {
      const result = await app
        .get('/v1/programRegistry')
        .query({ excludePatientId: "'bobby tables/\\'&;" });
      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toBe(0);
    });
  });
});
