import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { fake, fakeUser } from 'shared/test-helpers';
import { fakeReferenceData } from 'shared/test-helpers/fake';

import { initDb } from '../../initDb';

async function prepopulate(models) {
  const patientId = uuidv4();

  const {
    FhirPatient,
  } = models;

  await FhirPatient.create({ ...fake(FhirPatient), id: patientId });
}

describe('Patient', () => {
  let models;
  let context;
  let testIds;

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
    expect(patient.versionId).toExist();
  });
});
