import { fake, showError } from 'shared/test-helpers';
import {
  FhirAddress,
  FhirCodeableConcept,
  FhirCoding,
  FhirIdentifier,
  FhirPeriod,
} from 'shared/services/fhirTypes';
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
        system: 'https://tamanu.io/passport',
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

  it('should round-trip a composite field containing an array', () =>
    showError(async () => {
      // Arrange
      const { FhirPatient } = models;

      const id = new FhirIdentifier({
        use: 'official',
        value: 'P126362813',
        type: new FhirCodeableConcept({
          text: 'marriage certificate',
          coding: [
            new FhirCoding({
              code: 'MARCRT',
              version: '1.3',
              userSelected: true,
            }),
          ],
        }),
      });

      const address = new FhirAddress({
        use: 'home',
        type: 'physical',
        line: ['123 street lane', 'RD5'],
        city: 'Metropolis',
        postalCode: '00000',
        country: 'Placeland',
        period: new FhirPeriod({
          start: new Date('2022-02-02 22:02:02'),
          end: new Date('2022-02-22 20:22:02'),
        }),
      });

      // Act
      const patient = await FhirPatient.create({
        ...fake(FhirPatient),
        identifier: [id],
        address: [address],
      });
      await patient.reload();

      // Assert
      expect(patient.identifier).toEqual([id]);
      expect(patient.address).toEqual([address]);
    }));
});
