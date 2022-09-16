import { fake, showError } from 'shared/test-helpers';
import { FhirIdentifier } from 'shared/services/fhirTypes/identifier';
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

    // Act
    const patient = await FhirPatient.create(fake(FhirPatient));

    // Assert
    expect(patient.versionId).toBeTruthy();
  }));

  it('should update the version id on update', () => showError(async () => {
    // Arrange
    const { FhirPatient } = models;
    const patient = await FhirPatient.create(fake(FhirPatient));
    const { versionId } = patient;

    // Act
    await patient.update({ gender: 'other' });
    await patient.reload();

    // Assert
    expect(patient.versionId).not.toEqual(versionId);
  }));

  it('should support filling in the identifier', () => showError(async () => {
    // Arrange
    const { FhirPatient } = models;

    // Act
    const patient = await FhirPatient.create({
      ...fake(FhirPatient),
      gender: 'male',
      identifier: [new FhirIdentifier({
        use: 'usual',
        value: 'HE770WOR7D',
      })],
    });

    // Assert
    expect(patient.identifier).toBeTruthy();
  }));
});
