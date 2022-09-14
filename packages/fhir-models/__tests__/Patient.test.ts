import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { fake, fakeUser, fakeReferenceData } from 'shared/test-helpers/fake';

import { Context, initDb, Models } from './initDb';

async function prepopulate(models: Models) {
  const patientId = uuidv4();

  const {
    FhirPatient,
  } = models;

  await FhirPatient.create({ ...fake(FhirPatient), id: patientId });
}

describe('Patient', () => {
  let models: Models;
  let context: Context;

  beforeAll(async () => {
    context = await initDb({ testMode: true });
    models = context.models;
    // testIds = await prepopulate(models);
  });
  afterAll(() => context.sequelize.close());

  it('should create', async () => {
    // Arrange
    const { FhirPatient } = models;
    const patientId = uuidv4();

    // Act
    const patient = await FhirPatient.create({ ...fake(FhirPatient), id: patientId });

    // Assert
    expect(patient.versionId).toBeTruthy();
  });
});
