import { format, formatRFC7231 } from 'date-fns';

import { VISIBILITY_STATUSES } from 'shared/constants';
import { fake } from 'shared/test-helpers/fake';
import { getCurrentDateString } from 'shared/utils/dateTime';

import { createTestContext } from '../../utilities';
import { IDENTIFIER_NAMESPACE } from '../../../app/hl7fhir/utils';
import { fakeUUID } from 'shared/utils/generateId';

export function testPatientHandler(integrationName, requestHeaders = {}) {
  describe(`${integrationName} materialised integration - Patient`, () => {
    let ctx;
    let app;
    beforeAll(async () => {
      ctx = await createTestContext();
      app = await ctx.baseApp.asRole('practitioner');
    });
    afterAll(() => ctx.close());

    describe('full resource checks', () => {
      beforeEach(async () => {
        const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
        await FhirPatient.destroy({ where: {} });
        await Patient.destroy({ where: {} });
        await PatientAdditionalData.destroy({ where: {} });
      });

      it('fetches a patient by materialised ID', async () => {
        // arrange
        const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(
          fake(Patient, { dateOfDeath: getCurrentDateString() }),
        );
        const additionalData = await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        await patient.reload(); // saving PatientAdditionalData updates the patient too
        const mat = await FhirPatient.materialiseFromUpstream(patient.id);

        const path = `/v1/integration/${integrationName}/Patient/${mat.id}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'Patient',
          id: expect.any(String),
          meta: {
            // TODO: uncomment when we support versioning
            // versionId: expect.any(String),
            lastUpdated: format(new Date(patient.updatedAt), "yyyy-MM-dd'T'HH:mm:ssXXX"),
          },
          active: true,
          address: [
            {
              city: additionalData.cityTown,
              line: [additionalData.streetVillage],
              type: 'physical',
              use: 'home',
            },
          ],
          birthDate: format(new Date(patient.dateOfBirth), 'yyyy-MM-dd'),
          deceasedDateTime: format(new Date(patient.dateOfDeath), 'yyyy-MM-dd'),
          gender: patient.sex,
          identifier: [
            {
              assigner: {
                display: 'Tamanu',
              },
              system: 'http://tamanu.io/data-dictionary/application-reference-number.html',
              use: 'usual',
              value: patient.displayId,
            },
            {
              assigner: {
                display: 'RTA',
              },
              use: 'secondary',
              value: additionalData.drivingLicense,
            },
          ],
          name: [
            {
              family: patient.lastName,
              given: [patient.firstName, patient.middleName],
              prefix: [additionalData.title],
              use: 'official',
            },
            {
              text: patient.culturalName,
              use: 'nickname',
            },
          ],
          resourceType: 'Patient',
          telecom: [
            {
              rank: 1,
              value: additionalData.primaryContactNumber,
            },
            {
              rank: 2,
              value: additionalData.secondaryContactNumber,
            },
          ],
        });
        expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(patient.updatedAt)));
        expect(response).toHaveSucceeded();
      });

      it('searches a single patient by display ID', async () => {
        // arrange
        const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(
          fake(Patient, { dateOfDeath: getCurrentDateString() }),
        );
        const additionalData = await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        await patient.reload(); // saving PatientAdditionalData updates the patient too
        await FhirPatient.materialiseFromUpstream(patient.id);

        const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
        const path = `/v1/integration/${integrationName}/Patient?_sort=-issued&_page=0&_count=2&status=final&identifier=${id}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'Bundle',
          id: expect.any(String),
          timestamp: expect.any(String),
          meta: {
            lastUpdated: format(new Date(patient.updatedAt), "yyyy-MM-dd'T'HH:mm:ssXXX"),
          },
          type: 'searchset',
          total: 1,
          link: [
            {
              relation: 'self',
              url: expect.stringContaining(path),
            },
          ],
          entry: [
            {
              resource: {
                resourceType: 'Patient',
                id: expect.any(String),
                meta: {
                  // TODO: uncomment when we support versioning
                  // versionId: expect.any(String),
                  lastUpdated: format(new Date(patient.updatedAt), "yyyy-MM-dd'T'HH:mm:ssXXX"),
                },
                active: true,
                address: [
                  {
                    city: additionalData.cityTown,
                    line: [additionalData.streetVillage],
                    type: 'physical',
                    use: 'home',
                  },
                ],
                birthDate: format(new Date(patient.dateOfBirth), 'yyyy-MM-dd'),
                deceasedDateTime: format(new Date(patient.dateOfDeath), 'yyyy-MM-dd'),
                gender: patient.sex,
                identifier: [
                  {
                    assigner: {
                      display: 'Tamanu',
                    },
                    system: 'http://tamanu.io/data-dictionary/application-reference-number.html',
                    use: 'usual',
                    value: patient.displayId,
                  },
                  {
                    assigner: {
                      display: 'RTA',
                    },
                    use: 'secondary',
                    value: additionalData.drivingLicense,
                  },
                ],
                name: [
                  {
                    family: patient.lastName,
                    given: [patient.firstName, patient.middleName],
                    prefix: [additionalData.title],
                    use: 'official',
                  },
                  {
                    text: patient.culturalName,
                    use: 'nickname',
                  },
                ],
                telecom: [
                  {
                    rank: 1,
                    value: additionalData.primaryContactNumber,
                  },
                  {
                    rank: 2,
                    value: additionalData.secondaryContactNumber,
                  },
                ],
              },
            },
          ],
        });
        expect(response).toHaveSucceeded();
      });

      it('returns a list of patients when passed no query params', async () => {
        // arrange
        const { FhirPatient, Patient } = ctx.store.models;
        const patients = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);
        await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));
        const path = `/v1/integration/${integrationName}/Patient`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response.body.total).toBe(2);
        expect(response).toHaveSucceeded();
      });
    });

    describe('sorting', () => {
      beforeEach(async () => {
        const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
        await FhirPatient.destroy({ where: {} });
        await Patient.destroy({ where: {} });
        await PatientAdditionalData.destroy({ where: {} });
      });

      it('sorts by dateOfBirth ascending (birthdate)', async () => {
        const { FhirPatient, Patient } = ctx.store.models;
        const patients = await Promise.all([
          Patient.create(fake(Patient, { dateOfBirth: '1984-10-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-02-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-03-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-03-21' })),
        ]);
        await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

        const path = `/v1/integration/${integrationName}/Patient?_sort=birthdate`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(4);
        expect(response.body.entry[0].resource.birthDate).toBe('1984-10-20');
        expect(response.body.entry[1].resource.birthDate).toBe('1985-02-20');
        expect(response.body.entry[2].resource.birthDate).toBe('1985-03-20');
        expect(response.body.entry[3].resource.birthDate).toBe('1985-03-21');
      });

      it('sorts by dateOfBirth descending (-birthdate)', async () => {
        const { FhirPatient, Patient } = ctx.store.models;
        const patients = await Promise.all([
          Patient.create(fake(Patient, { dateOfBirth: '1984-10-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-02-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-03-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-03-21' })),
        ]);
        await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

        const path = `/v1/integration/${integrationName}/Patient?_sort=-birthdate`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(4);
        expect(response.body.entry[0].resource.birthDate).toBe('1985-03-21');
        expect(response.body.entry[1].resource.birthDate).toBe('1985-03-20');
        expect(response.body.entry[2].resource.birthDate).toBe('1985-02-20');
        expect(response.body.entry[3].resource.birthDate).toBe('1984-10-20');
      });

      // TODO (EPI-202)
      // the code *does* support nested arrays, but it results in inconsistent
      // ordering from run to run so it's disabled in query.js.
      describe.skip('in fields with nested arrays', () => {
        it('sorts by firstName ascending (given)', async () => {
          const { FhirPatient, Patient } = ctx.store.models;
          const patients = await Promise.all([
            Patient.create(fake(Patient, { firstName: 'Alice' })),
            Patient.create(fake(Patient, { firstName: 'Bob' })),
            Patient.create(fake(Patient, { firstName: 'Charlie' })),
          ]);
          await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

          const path = `/v1/integration/${integrationName}/Patient?_sort=given`;
          const response = await app.get(path).set(requestHeaders);

          expect(response).toHaveSucceeded();
          expect(response.body.total).toBe(3);
          expect(response.body.entry[0].resource.name[0].given[0]).toBe('Alice');
          expect(response.body.entry[1].resource.name[0].given[0]).toBe('Bob');
          expect(response.body.entry[2].resource.name[0].given[0]).toBe('Charlie');
        });

        it('sorts by firstName descending (-given)', async () => {
          const { FhirPatient, Patient } = ctx.store.models;
          const patients = await Promise.all([
            Patient.create(fake(Patient, { firstName: 'Alice' })),
            Patient.create(fake(Patient, { firstName: 'Bob' })),
            Patient.create(fake(Patient, { firstName: 'Charlie' })),
          ]);
          await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

          const path = `/v1/integration/${integrationName}/Patient?_sort=-given`;
          const response = await app.get(path).set(requestHeaders);

          expect(response).toHaveSucceeded();
          expect(response.body.total).toBe(3);
          expect(response.body.entry[0].resource.name[0].given[0]).toBe('Charlie');
          expect(response.body.entry[1].resource.name[0].given[0]).toBe('Bob');
          expect(response.body.entry[2].resource.name[0].given[0]).toBe('Alice');
        });

        it('sorts by lastName ascending (family)', async () => {
          const { FhirPatient, Patient } = ctx.store.models;
          const patients = await Promise.all([
            Patient.create(fake(Patient, { lastName: 'Adams' })),
            Patient.create(fake(Patient, { lastName: 'Brown' })),
            Patient.create(fake(Patient, { lastName: 'Carter' })),
          ]);
          await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

          const path = `/v1/integration/${integrationName}/Patient?_sort=family`;
          const response = await app.get(path).set(requestHeaders);

          expect(response).toHaveSucceeded();
          expect(response.body.total).toBe(3);
          expect(response.body.entry[0].resource.name[0].family).toBe('Adams');
          expect(response.body.entry[1].resource.name[0].family).toBe('Brown');
          expect(response.body.entry[2].resource.name[0].family).toBe('Carter');
        });

        it('sorts by lastName descending (-family)', async () => {
          const { FhirPatient, Patient } = ctx.store.models;
          const patients = await Promise.all([
            Patient.create(fake(Patient, { lastName: 'Adams' })),
            Patient.create(fake(Patient, { lastName: 'Brown' })),
            Patient.create(fake(Patient, { lastName: 'Carter' })),
          ]);
          await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

          const path = `/v1/integration/${integrationName}/Patient?_sort=-family`;
          const response = await app.get(path).set(requestHeaders);

          expect(response).toHaveSucceeded();
          expect(response.body.total).toBe(3);
          expect(response.body.entry[0].resource.name[0].family).toBe('Carter');
          expect(response.body.entry[1].resource.name[0].family).toBe('Brown');
          expect(response.body.entry[2].resource.name[0].family).toBe('Adams');
        });

        it('sorts by additionalData.cityTown ascending (address)', async () => {
          const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
          const [patientOne, patientTwo, patientThree] = await Promise.all([
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
          ]);

          await Promise.all([
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Amsterdam' }),
              patientId: patientOne.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Berlin' }),
              patientId: patientTwo.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Cabo' }),
              patientId: patientThree.id,
            }),
          ]);
          await Promise.all(
            [patientOne, patientTwo, patientThree].map(({ id }) =>
              FhirPatient.materialiseFromUpstream(id),
            ),
          );

          const path = `/v1/integration/${integrationName}/Patient?_sort=address`;
          const response = await app.get(path).set(requestHeaders);

          expect(response).toHaveSucceeded();
          expect(response.body.total).toBe(3);
          expect(response.body.entry[0].resource.address[0].city).toBe('Amsterdam');
          expect(response.body.entry[1].resource.address[0].city).toBe('Berlin');
          expect(response.body.entry[2].resource.address[0].city).toBe('Cabo');
        });

        it('sorts by additionalData.cityTown descending (-address)', async () => {
          const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
          const [patientOne, patientTwo, patientThree] = await Promise.all([
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
          ]);

          await Promise.all([
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Amsterdam' }),
              patientId: patientOne.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Berlin' }),
              patientId: patientTwo.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Cabo' }),
              patientId: patientThree.id,
            }),
          ]);
          await Promise.all(
            [patientOne, patientTwo, patientThree].map(({ id }) =>
              FhirPatient.materialiseFromUpstream(id),
            ),
          );

          const path = `/v1/integration/${integrationName}/Patient?_sort=-address`;
          const response = await app.get(path).set(requestHeaders);

          expect(response).toHaveSucceeded();
          expect(response.body.total).toBe(3);
          expect(response.body.entry[0].resource.address[0].city).toBe('Cabo');
          expect(response.body.entry[1].resource.address[0].city).toBe('Berlin');
          expect(response.body.entry[2].resource.address[0].city).toBe('Amsterdam');
        });

        it('sorts by additionalData.cityTown ascending (address-city)', async () => {
          const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
          const [patientOne, patientTwo, patientThree] = await Promise.all([
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
          ]);

          await Promise.all([
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Amsterdam' }),
              patientId: patientOne.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Berlin' }),
              patientId: patientTwo.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Cabo' }),
              patientId: patientThree.id,
            }),
          ]);
          await Promise.all(
            [patientOne, patientTwo, patientThree].map(({ id }) =>
              FhirPatient.materialiseFromUpstream(id),
            ),
          );

          const path = `/v1/integration/${integrationName}/Patient?_sort=address-city`;
          const response = await app.get(path).set(requestHeaders);

          expect(response).toHaveSucceeded();
          expect(response.body.total).toBe(3);
          expect(response.body.entry[0].resource.address[0].city).toBe('Amsterdam');
          expect(response.body.entry[1].resource.address[0].city).toBe('Berlin');
          expect(response.body.entry[2].resource.address[0].city).toBe('Cabo');
        });

        it('sorts by additionalData.cityTown descending (-address-city)', async () => {
          const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
          const [patientOne, patientTwo, patientThree] = await Promise.all([
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
          ]);

          await Promise.all([
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Amsterdam' }),
              patientId: patientOne.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Berlin' }),
              patientId: patientTwo.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { cityTown: 'Cabo' }),
              patientId: patientThree.id,
            }),
          ]);
          await Promise.all(
            [patientOne, patientTwo, patientThree].map(({ id }) =>
              FhirPatient.materialiseFromUpstream(id),
            ),
          );

          const path = `/v1/integration/${integrationName}/Patient?_sort=-address-city`;
          const response = await app.get(path).set(requestHeaders);

          expect(response).toHaveSucceeded();
          expect(response.body.total).toBe(3);
          expect(response.body.entry[0].resource.address[0].city).toBe('Cabo');
          expect(response.body.entry[1].resource.address[0].city).toBe('Berlin');
          expect(response.body.entry[2].resource.address[0].city).toBe('Amsterdam');
        });

        it('sorts by additionalData.primaryContactNumber ascending (telecom)', async () => {
          const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
          const [patientOne, patientTwo, patientThree] = await Promise.all([
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
          ]);

          await Promise.all([
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { primaryContactNumber: '123456781' }),
              patientId: patientOne.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { primaryContactNumber: '123456782' }),
              patientId: patientTwo.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { primaryContactNumber: '123456783' }),
              patientId: patientThree.id,
            }),
          ]);
          await Promise.all(
            [patientOne, patientTwo, patientThree].map(({ id }) =>
              FhirPatient.materialiseFromUpstream(id),
            ),
          );

          const path = `/v1/integration/${integrationName}/Patient?_sort=telecom`;
          const response = await app.get(path).set(requestHeaders);

          expect(response).toHaveSucceeded();
          expect(response.body.total).toBe(3);
          expect(response.body.entry[0].resource.telecom[0].value).toBe('123456781');
          expect(response.body.entry[1].resource.telecom[0].value).toBe('123456782');
          expect(response.body.entry[2].resource.telecom[0].value).toBe('123456783');
        });

        it('sorts by additionalData.primaryContactNumber descending (-telecom)', async () => {
          const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
          const [patientOne, patientTwo, patientThree] = await Promise.all([
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
            Patient.create(fake(Patient)),
          ]);

          await Promise.all([
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { primaryContactNumber: '123456781' }),
              patientId: patientOne.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { primaryContactNumber: '123456782' }),
              patientId: patientTwo.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { primaryContactNumber: '123456783' }),
              patientId: patientThree.id,
            }),
          ]);
          await Promise.all(
            [patientOne, patientTwo, patientThree].map(({ id }) =>
              FhirPatient.materialiseFromUpstream(id),
            ),
          );

          const path = `/v1/integration/${integrationName}/Patient?_sort=-telecom`;
          const response = await app.get(path).set(requestHeaders);

          expect(response).toHaveSucceeded();
          expect(response.body.total).toBe(3);
          expect(response.body.entry[0].resource.telecom[0].value).toBe('123456783');
          expect(response.body.entry[1].resource.telecom[0].value).toBe('123456782');
          expect(response.body.entry[2].resource.telecom[0].value).toBe('123456781');
        });

        it('sorts by multiple fields', async () => {
          const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
          const [
            patientOne,
            patientTwo,
            patientThree,
            patientFour,
            patientFive,
          ] = await Promise.all([
            Patient.create(fake(Patient, { firstName: 'Alice', lastName: 'Adams' })),
            Patient.create(fake(Patient, { firstName: 'Alice', lastName: 'Adams' })),
            Patient.create(fake(Patient, { firstName: 'Alice', lastName: 'Baker' })),
            Patient.create(fake(Patient, { firstName: 'Bob', lastName: 'Adams' })),
            Patient.create(fake(Patient, { firstName: 'Bob', lastName: 'Baker' })),
          ]);

          await Promise.all([
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { primaryContactNumber: '123456781' }),
              patientId: patientOne.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { primaryContactNumber: '123456782' }),
              patientId: patientTwo.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { primaryContactNumber: '123456783' }),
              patientId: patientThree.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { primaryContactNumber: '123456784' }),
              patientId: patientFour.id,
            }),
            PatientAdditionalData.create({
              ...fake(PatientAdditionalData, { primaryContactNumber: '123456785' }),
              patientId: patientFive.id,
            }),
          ]);
          await Promise.all(
            [patientOne, patientTwo, patientThree, patientFour, patientFive].map(({ id }) =>
              FhirPatient.materialiseFromUpstream(id),
            ),
          );

          // Sort by firstName ascending, lastName descending, primaryContactNumber ascending
          const path = `/v1/integration/${integrationName}/Patient?_sort=given,-family,telecom`;
          const response = await app.get(path).set(requestHeaders);

          expect(response).toHaveSucceeded();
          expect(response.body.total).toBe(5);
          // Numbers don't repeat so everything else should be in place
          expect(response.body.entry[0].resource.telecom[0].value).toBe('123456783');
          expect(response.body.entry[1].resource.telecom[0].value).toBe('123456781');
          expect(response.body.entry[2].resource.telecom[0].value).toBe('123456782');
          expect(response.body.entry[3].resource.telecom[0].value).toBe('123456785');
          expect(response.body.entry[4].resource.telecom[0].value).toBe('123456784');
        });
      });
    });

    describe('filtering', () => {
      beforeEach(async () => {
        const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
        await FhirPatient.destroy({ where: {} });
        await Patient.destroy({ where: {} });
        await PatientAdditionalData.destroy({ where: {} });
      });

      it('filters patient by displayId (identifier)', async () => {
        const { FhirPatient, Patient } = ctx.store.models;
        const [patientOne, patientTwo] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);
        await Promise.all(
          [patientOne, patientTwo].map(({ id }) => FhirPatient.materialiseFromUpstream(id)),
        );

        const identifier = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patientOne.displayId}`);
        const path = `/v1/integration/${integrationName}/Patient?identifier=${identifier}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(1);
      });

      it('filters patients by firstName (given)', async () => {
        const { FhirPatient, Patient } = ctx.store.models;
        const firstName = 'John';
        const patients = await Promise.all([
          Patient.create(fake(Patient, { firstName })),
          Patient.create(fake(Patient, { firstName })),
          Patient.create(fake(Patient, { firstName: 'Bob' })),
        ]);
        await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

        const path = `/v1/integration/${integrationName}/Patient?given=${firstName}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response.body.total).toBe(2);
        expect(response).toHaveSucceeded();
      });

      it('filters patients by lastName (family)', async () => {
        const { FhirPatient, Patient } = ctx.store.models;
        const lastName = 'Doe';
        const patients = await Promise.all([
          Patient.create(fake(Patient, { lastName })),
          Patient.create(fake(Patient, { lastName })),
          Patient.create(fake(Patient, { lastName: 'Gray' })),
        ]);
        await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

        const path = `/v1/integration/${integrationName}/Patient?family=${lastName}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response.body.total).toBe(2);
        expect(response).toHaveSucceeded();
      });

      it('filters patients by sex (gender)', async () => {
        const { FhirPatient, Patient } = ctx.store.models;
        const sex = 'other';
        const patients = await Promise.all([
          Patient.create(fake(Patient, { sex })),
          Patient.create(fake(Patient, { sex })),
          Patient.create(fake(Patient, { sex: 'female' })),
        ]);
        await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

        const path = `/v1/integration/${integrationName}/Patient?gender=${sex}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response.body.total).toBe(2);
        expect(response).toHaveSucceeded();
      });

      it('filters patients by dateOfBirth (birthdate)', async () => {
        const { FhirPatient, Patient } = ctx.store.models;
        const dateOfBirth = '1990-05-25';
        const patients = await Promise.all([
          Patient.create(fake(Patient, { dateOfBirth })),
          Patient.create(fake(Patient, { dateOfBirth })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-10-20' })),
        ]);
        await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

        const path = `/v1/integration/${integrationName}/Patient?birthdate=${dateOfBirth}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by being deceased or not (deceased)', async () => {
        const { FhirPatient, Patient } = ctx.store.models;
        const patients = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient, { dateOfDeath: getCurrentDateString() })),
        ]);
        await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

        // Query deceased=true
        const pathTrue = `/v1/integration/${integrationName}/Patient?deceased=true`;
        const responseTrue = await app.get(pathTrue).set(requestHeaders);

        expect(responseTrue.body.total).toBe(1);
        expect(responseTrue).toHaveSucceeded();

        // Query deceased=false
        const pathFalse = `/v1/integration/${integrationName}/Patient?deceased=false`;
        const responseFalse = await app.get(pathFalse).set(requestHeaders);

        expect(responseFalse).toHaveSucceeded();
        expect(responseFalse.body.total).toBe(2);
      });

      it('filters patients by additionalData.cityTown (address-city)', async () => {
        const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        const cityTown = 'luxembourg';
        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'quito' }),
            patientId: patientThree.id,
          }),
        ]);
        await Promise.all(
          [patientOne, patientTwo, patientThree].map(({ id }) =>
            FhirPatient.materialiseFromUpstream(id),
          ),
        );

        const path = `/v1/integration/${integrationName}/Patient?address-city=${cityTown}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filtering by address looks up a bunch of fields', async () => {
        const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'luxembourg' }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { streetVillage: 'luxembourg' }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'quito' }),
            patientId: patientThree.id,
          }),
        ]);
        await Promise.all(
          [patientOne, patientTwo, patientThree].map(({ id }) =>
            FhirPatient.materialiseFromUpstream(id),
          ),
        );

        const path = `/v1/integration/${integrationName}/Patient?address=luxembourg`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body).toMatchObject({
          resourceType: 'Bundle',
          id: expect.any(String),
          type: 'searchset',
          timestamp: expect.any(String),
          total: 2,
        });
      });

      it('filtering by telecom looks up a bunch of fields', async () => {
        const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        const phone = '123456789';
        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: phone }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { secondaryContactNumber: phone }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '987654321' }),
            patientId: patientThree.id,
          }),
        ]);
        await Promise.all(
          [patientOne, patientTwo, patientThree].map(({ id }) =>
            FhirPatient.materialiseFromUpstream(id),
          ),
        );

        const path = `/v1/integration/${integrationName}/Patient?telecom=${phone}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body).toMatchObject({
          resourceType: 'Bundle',
          id: expect.any(String),
          type: 'searchset',
          timestamp: expect.any(String),
          total: 2,
        });
      });

      it('filters patient by visibilityStatus (active)', async () => {
        const { Patient, FhirPatient } = ctx.store.models;
        const patients = await Promise.all([
          Patient.create(
            fake(Patient, {
              visibilityStatus: 'current',
            }),
          ),
          Patient.create(fake(Patient, { visibilityStatus: 'historical' })),
          Patient.create(fake(Patient, { visibilityStatus: 'merged' })),
          Patient.create(fake(Patient, { visibilityStatus: 'whatever' })),
        ]);
        await Promise.all(patients.map(({ id }) => FhirPatient.materialiseFromUpstream(id)));

        const path = `/v1/integration/${integrationName}/Patient?active=true`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body).toMatchObject({
          resourceType: 'Bundle',
          id: expect.any(String),
          type: 'searchset',
          timestamp: expect.any(String),
          total: 1,
        });
      });
    });

    describe('errors', () => {
      it('returns not found when fetching a non-existent patient', async () => {
        // arrange
        const id = fakeUUID();
        const path = `/v1/integration/${integrationName}/Patient/${id}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'not-found',
              diagnostics: expect.any(String),
              details: {
                text: `no Patient with id ${id}`,
              },
            },
          ],
        });
        expect(response.status).toBe(404);
      });

      it('returns some errors when passed wrong query params', async () => {
        // arrange
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(fake(Patient));
        await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        const path = `/v1/integration/${integrationName}/Patient?_sort=id&_page=z&_count=x`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: expect.any(String),
              expression: '_sort',
              details: {
                text: '_sort key is not an allowed value',
              },
            },
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: expect.any(String),
              expression: '_page',
              details: {
                text:
                  'this must be a `number` type, but the final value was: `NaN` (cast from the value `"z"`).',
              },
            },
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: expect.any(String),
              expression: '_count',
              details: {
                text:
                  'this must be a `number` type, but the final value was: `NaN` (cast from the value `"x"`).',
              },
            },
          ],
        });
        expect(response).toHaveRequestError(500);
      });

      it('returns an error if there are any unknown patient params', async () => {
        // arrange
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(fake(Patient));
        await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        const path = `/v1/integration/${integrationName}/Patient?whatever=something`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'not-supported',
              diagnostics: expect.any(String),
              details: {
                text: 'parameter is not supported: whatever',
              },
            },
          ],
        });
        expect(response).toHaveRequestError(501);
      });
    });

    describe('merges', () => {
      let ids;

      // a <- b <- c
      //      b <- d
      beforeAll(async () => {
        const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
        await FhirPatient.destroy({ where: {} });
        await Patient.destroy({ where: {} });
        await PatientAdditionalData.destroy({ where: {} });

        const primaryA = await Patient.create(
          fake(Patient, {
            visibilityStatus: VISIBILITY_STATUSES.CURRENT,
          }),
        );

        const mergedB = await Patient.create(
          fake(Patient, {
            visibilityStatus: VISIBILITY_STATUSES.MERGED,
            mergedIntoId: primaryA.id,
          }),
        );

        const mergedC = await Patient.create(
          fake(Patient, {
            visibilityStatus: VISIBILITY_STATUSES.MERGED,
            mergedIntoId: mergedB.id,
          }),
        );

        const mergedD = await Patient.create(
          fake(Patient, {
            visibilityStatus: VISIBILITY_STATUSES.MERGED,
            mergedIntoId: mergedB.id,
          }),
        );

        const [a, b, c, d] = (
          await Promise.all(
            [primaryA, mergedB, mergedC, mergedD].map(({ id }) =>
              FhirPatient.materialiseFromUpstream(id),
            ),
          )
        ).map(row => row.id);

        await FhirPatient.resolveUpstreamLinks();

        ids = { a, b, c, d };
      });

      it('links patients that were merged into the top level patient A (as fetch)', async () => {
        const path = `/v1/integration/${integrationName}/Patient/${ids.a}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'Patient',
          id: ids.a,
          meta: {
            lastUpdated: expect.any(String),
          },
          active: true,
          address: expect.any(Array),
          birthDate: expect.any(String),
          gender: expect.any(String),
          identifier: expect.any(Array),
          name: expect.any(Array),
          telecom: expect.any(Array),
          link: [
            {
              type: 'replaces',
              other: {
                reference: `Patient/${ids.b}`,
                type: 'Patient',
                display: expect.any(String),
              },
            },
            {
              type: 'seealso',
              other: {
                reference: `Patient/${ids.c}`,
                type: 'Patient',
                display: expect.any(String),
              },
            },
            {
              type: 'seealso',
              other: {
                reference: `Patient/${ids.d}`,
                type: 'Patient',
                display: expect.any(String),
              },
            },
          ],
        });
        expect(response).toHaveSucceeded();
      });

      it('links patients that were merged into, and patients that replaced, the mid level patient B (as fetch)', async () => {
        const path = `/v1/integration/${integrationName}/Patient/${ids.b}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'Patient',
          id: ids.b,
          meta: {
            lastUpdated: expect.any(String),
          },
          active: false,
          address: expect.any(Array),
          birthDate: expect.any(String),
          gender: expect.any(String),
          identifier: expect.any(Array),
          name: expect.any(Array),
          telecom: expect.any(Array),
          link: [
            {
              type: 'replaced-by',
              other: {
                reference: `Patient/${ids.a}`,
                type: 'Patient',
                display: expect.any(String),
              },
            },
            {
              type: 'replaces',
              other: {
                reference: `Patient/${ids.c}`,
                type: 'Patient',
                display: expect.any(String),
              },
            },
            {
              type: 'replaces',
              other: {
                reference: `Patient/${ids.d}`,
                type: 'Patient',
                display: expect.any(String),
              },
            },
          ],
        });
        expect(response).toHaveSucceeded();
      });

      it('links patients that replaced the mid level patients C and D (as search)', async () => {
        const path = `/v1/integration/${integrationName}/Patient?_id=${ids.c},${ids.d}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        const resourceC = response.body?.entry.find(({ resource }) => resource.id === ids.c)
          ?.resource;
        const resourceD = response.body?.entry.find(({ resource }) => resource.id === ids.d)
          ?.resource;

        expect(resourceC).toMatchObject({
          resourceType: 'Patient',
          id: ids.c,
          meta: {
            lastUpdated: expect.any(String),
          },
          active: false,
          address: expect.any(Array),
          birthDate: expect.any(String),
          gender: expect.any(String),
          identifier: expect.any(Array),
          name: expect.any(Array),
          telecom: expect.any(Array),
          link: [
            {
              type: 'replaced-by',
              other: {
                reference: `Patient/${ids.a}`,
                type: 'Patient',
                display: expect.any(String),
              },
            },
          ],
        });

        expect(resourceD).toMatchObject({
          resourceType: 'Patient',
          id: ids.d,
          meta: {
            lastUpdated: expect.any(String),
          },
          active: false,
          address: expect.any(Array),
          birthDate: expect.any(String),
          gender: expect.any(String),
          identifier: expect.any(Array),
          name: expect.any(Array),
          telecom: expect.any(Array),
          link: [
            {
              type: 'replaced-by',
              other: {
                reference: `Patient/${ids.a}`,
                type: 'Patient',
                display: expect.any(String),
              },
            },
          ],
        });

        expect(response.body.total).toBe(2);
        expect(response).toHaveSucceeded();
      });
    });
  });
}
