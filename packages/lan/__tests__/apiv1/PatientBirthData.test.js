import { UniqueConstraintError } from 'sequelize';

import { createDummyPatient } from 'shared/demoData/patients';
import { fake } from 'shared/test-helpers/fake';

import { createTestContext } from '../utilities';

describe('PatientBirthData', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });
  afterAll(() => ctx.close());

  it('should throw an error when creating more than 1 PatientBirthData for 1 Patient', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));

    await models.PatientBirthData.create(fake(models.PatientBirthData, { patientId: patient.id }));
    await expect(
      models.PatientBirthData.create(fake(models.PatientBirthData, { patientId: patient.id })),
    ).rejects.toThrow(UniqueConstraintError);
  });
});
