import { fake, withErrorShown } from '@tamanu/shared/test-helpers';
import {
  FhirAddress,
  FhirCodeableConcept,
  FhirCoding,
  FhirHumanName,
  FhirIdentifier,
  FhirPeriod,
} from '@tamanu/shared/services/fhirTypes';
import { createTestContext } from '../../utilities';

describe('Patient', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });
  afterAll(() => ctx.close());

  it(
    'should create directly',
    withErrorShown(async () => {
      // Arrange
      const { FhirPatient } = models;

      // Act
      const patient = await FhirPatient.create(fake(FhirPatient));

      // Assert
      expect(patient.versionId).toBeTruthy();
    }),
  );

  it(
    'should update the version id on update',
    withErrorShown(async () => {
      // Arrange
      const { FhirPatient } = models;
      const patient = await FhirPatient.create(fake(FhirPatient));
      const { versionId } = patient;

      // Act
      await patient.update({ gender: 'other' });
      await patient.reload();

      // Assert
      expect(patient.versionId).not.toEqual(versionId);
    }),
  );

  it(
    'should round-trip a composite field',
    withErrorShown(async () => {
      // Arrange
      const { FhirPatient } = models;
      const idA = new FhirIdentifier({
        use: 'usual',
        value: 'HE770 WOR7D',
        period: new FhirPeriod({
          start: '2022-02-02T22:02:02-01:00',
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
    }),
  );

  it(
    'should round-trip a composite field with update',
    withErrorShown(async () => {
      // Arrange
      const { FhirPatient } = models;
      const id = new FhirIdentifier({
        use: 'official',
        value: 'P126362813',
        system: 'https://tamanu.io/passport',
      });

      // Act
      const patient = await FhirPatient.create({
        ...fake(FhirPatient),
        gender: 'male',
      });
      await patient.update({ identifier: [id] });
      await patient.reload();

      // Assert
      expect(patient.identifier).toEqual([id]);
    }),
  );

  it(
    'should round-trip a composite field with build',
    withErrorShown(async () => {
      // Arrange
      const { FhirPatient } = models;
      const id = new FhirIdentifier({
        use: 'official',
        value: 'P126362813',
        system: 'https://tamanu.io/passport',
      });

      // Act
      const patient = FhirPatient.build({
        ...fake(FhirPatient),
        gender: 'male',
      });
      patient.set({ identifier: [id] });
      await patient.save();
      await patient.reload();

      // Assert
      expect(patient.identifier).toEqual([id]);
    }),
  );

  it(
    'should round-trip a composite field containing an array',
    withErrorShown(async () => {
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
          start: '2022-02-02T22:02:02-01:00',
          end: '2022-02-22T20:22:02-01:00',
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
    }),
  );

  it(
    'should materialise',
    withErrorShown(async () => {
      // Arrange
      const { FhirPatient, Patient, PatientAdditionalData } = models;
      const patient = await Patient.create(fake(Patient));
      const pad = await PatientAdditionalData.create({
        ...fake(PatientAdditionalData),
        patientId: patient.id,
      });

      // Act
      const fhirPatient = await FhirPatient.materialiseFromUpstream(patient.id);
      await fhirPatient.reload();

      // Assert
      expect(fhirPatient.gender).toEqual(patient.sex);
      expect(fhirPatient.name).toEqual([
        new FhirHumanName({
          use: 'official',
          prefix: [pad.title],
          family: patient.lastName,
          given: [patient.firstName, patient.middleName],
        }),
        new FhirHumanName({
          use: 'nickname',
          text: patient.culturalName,
        }),
      ]);
    }),
  );
});
