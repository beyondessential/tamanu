import { fake, showError } from 'shared/test-helpers';
import { FhirIdentifier, FhirPeriod } from 'shared/services/fhirTypes';
import { createTestContext } from '../../utilities';

describe('Patient', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });
  afterAll(() => ctx.close());

  it('should create', () =>
    showError(async () => {
      // Arrange
      const { FhirPatient } = models;

      // Act
      const patient = await FhirPatient.create(fake(FhirPatient));

      // Assert
      expect(patient.versionId).toBeTruthy();
    }));

  it('should update the version id on update', () =>
    showError(async () => {
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

  it('should round-trip a composite field', () =>
    showError(async () => {
      // Arrange
      const { FhirPatient } = models;
      const idA = new FhirIdentifier({
        use: 'usual',
        value: 'HE770 WOR7D',
        period: new FhirPeriod({
          // something to note: because we use DATETIMESTRING internally, subseconds are cut off
          start: new Date('2022-02-02 22:02:02'),
        }),
      });
      const idB = new FhirIdentifier({
        use: 'official',
        value: 'P126362813',
        system: 'passport',
      });

      // Act
      const patient = await FhirPatient.create({
        ...fake(FhirPatient),
        gender: 'male',
        identifier: [idA, idB],
      });
      await patient.reload();

      // Assert
      expect(patient.identifier).toEqual([idA, idB]);
    }));
});
