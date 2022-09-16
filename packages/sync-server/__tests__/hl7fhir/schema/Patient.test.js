import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { fake, fakeUser, fakeReferenceData, showError } from 'shared/test-helpers';
import { createTestContext } from '../../utilities';

describe('Patient', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });
  afterAll(() => ctx.close());

  it('should create', () => showError(async () => {
    // Arrange
    const { FhirPatient } = models;
    const patientId = uuidv4();

    // Act
    const patient = await FhirPatient.create({ ...fake(FhirPatient), id: patientId, identifier: [] });

    // Assert
    expect(patient.versionId).toExist();
  }));
});
