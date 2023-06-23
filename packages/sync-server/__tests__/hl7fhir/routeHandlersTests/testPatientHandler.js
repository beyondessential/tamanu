import { format } from 'date-fns';

import { fake } from 'shared/test-helpers/fake';
import { getCurrentDateString } from 'shared/utils/dateTime';

import { createTestContext } from '../../utilities';
import { IDENTIFIER_NAMESPACE } from '../../../app/hl7fhir/utils';

export function testPatientHandler(integrationName, requestHeaders = {}) {
  describe(`${integrationName} integration - Patient`, () => {
    let ctx;
    let app;
    beforeAll(async () => {
      ctx = await createTestContext(requestHeaders['X-Tamanu-Client']);
      app = await ctx.baseApp.asRole('practitioner');
    });
    afterAll(() => ctx.close());

    describe('success', () => {
      it('fetches a patient', async () => {
        // arrange
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(
          fake(Patient, { dateOfDeath: getCurrentDateString() }),
        );
        const additionalData = await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        await patient.reload(); // saving PatientAdditionalData updates the patient too
        const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
        const path = `/v1/integration/${integrationName}/Patient?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
          resourceType: 'Bundle',
          id: 'patients',
          meta: {
            lastUpdated: patient.updatedAt.toISOString(),
          },
          type: 'searchset',
          timestamp: expect.any(String),
          total: 1,
          link: [
            {
              relation: 'self',
              url: expect.stringContaining(path),
            },
          ],
          entry: [
            {
              fullUrl: expect.stringContaining(patient.id),
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
              deceasedDateTime: format(new Date(patient.dateOfDeath), "yyyy-MM-dd'T'HH:mm:ssXXX"),
              gender: patient.sex,
              id: patient.id,
              identifier: [
                {
                  assigner: 'Tamanu',
                  system: 'http://tamanu.io/data-dictionary/application-reference-number.html',
                  use: 'usual',
                  value: patient.displayId,
                },
                {
                  assigner: 'RTA',
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
            },
          ],
        });
      });

      it("returns no error but no results when subject:identifier doesn't match a patient", async () => {
        // arrange
        const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|abc123-not-real`);
        const path = `/v1/integration/${integrationName}/Patient?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
          resourceType: 'Bundle',
          id: 'patients',
          meta: {
            lastUpdated: null,
          },
          type: 'searchset',
          timestamp: expect.any(String),
          total: 0,
          link: [
            {
              relation: 'self',
              url: expect.stringContaining(path),
            },
          ],
          entry: [],
        });
      });

      it('returns a list of patients when passed no query params', async () => {
        // arrange
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(fake(Patient));
        await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        const path = `/v1/integration/${integrationName}/Patient`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });
    });

    describe('sorts correctly', () => {
      beforeEach(async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        await Patient.destroy({ where: {} });
        await PatientAdditionalData.destroy({ where: {} });
      });

      it('sorts by firstName ascending (given)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { firstName: 'Alice' })),
          Patient.create(fake(Patient, { firstName: 'Bob' })),
          Patient.create(fake(Patient, { firstName: 'Charlie' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=given`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].name[0].given[0]).toBe('Alice');
        expect(response.body.entry[1].name[0].given[0]).toBe('Bob');
        expect(response.body.entry[2].name[0].given[0]).toBe('Charlie');
      });

      it('sorts by firstName descending (-given)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { firstName: 'Alice' })),
          Patient.create(fake(Patient, { firstName: 'Bob' })),
          Patient.create(fake(Patient, { firstName: 'Charlie' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=-given`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].name[0].given[0]).toBe('Charlie');
        expect(response.body.entry[1].name[0].given[0]).toBe('Bob');
        expect(response.body.entry[2].name[0].given[0]).toBe('Alice');
      });

      it('sorts by lastName ascending (family)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { lastName: 'Adams' })),
          Patient.create(fake(Patient, { lastName: 'Brown' })),
          Patient.create(fake(Patient, { lastName: 'Carter' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=family`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].name[0].family).toBe('Adams');
        expect(response.body.entry[1].name[0].family).toBe('Brown');
        expect(response.body.entry[2].name[0].family).toBe('Carter');
      });

      it('sorts by lastName descending (-family)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { lastName: 'Adams' })),
          Patient.create(fake(Patient, { lastName: 'Brown' })),
          Patient.create(fake(Patient, { lastName: 'Carter' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=-family`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].name[0].family).toBe('Carter');
        expect(response.body.entry[1].name[0].family).toBe('Brown');
        expect(response.body.entry[2].name[0].family).toBe('Adams');
      });

      it('sorts by dateOfBirth ascending (birthdate)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { dateOfBirth: '1984-10-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-02-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-03-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-03-21' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=birthdate`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(4);
        expect(response.body.entry[0].birthDate).toBe('1984-10-20');
        expect(response.body.entry[1].birthDate).toBe('1985-02-20');
        expect(response.body.entry[2].birthDate).toBe('1985-03-20');
        expect(response.body.entry[3].birthDate).toBe('1985-03-21');
      });

      it('sorts by dateOfBirth descending (-birthdate)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { dateOfBirth: '1984-10-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-02-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-03-20' })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-03-21' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=-birthdate`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(4);
        expect(response.body.entry[0].birthDate).toBe('1985-03-21');
        expect(response.body.entry[1].birthDate).toBe('1985-03-20');
        expect(response.body.entry[2].birthDate).toBe('1985-02-20');
        expect(response.body.entry[3].birthDate).toBe('1984-10-20');
      });

      it('sorts by additionalData.cityTown ascending (address)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
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

        const path = `/v1/integration/${integrationName}/Patient?_sort=address`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].address[0].city).toBe('Amsterdam');
        expect(response.body.entry[1].address[0].city).toBe('Berlin');
        expect(response.body.entry[2].address[0].city).toBe('Cabo');
      });

      it('sorts by additionalData.cityTown descending (-address)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
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

        const path = `/v1/integration/${integrationName}/Patient?_sort=-address`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].address[0].city).toBe('Cabo');
        expect(response.body.entry[1].address[0].city).toBe('Berlin');
        expect(response.body.entry[2].address[0].city).toBe('Amsterdam');
      });

      it('sorts by additionalData.cityTown ascending (address-city)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
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

        const path = `/v1/integration/${integrationName}/Patient?_sort=address-city`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].address[0].city).toBe('Amsterdam');
        expect(response.body.entry[1].address[0].city).toBe('Berlin');
        expect(response.body.entry[2].address[0].city).toBe('Cabo');
      });

      it('sorts by additionalData.cityTown descending (-address-city)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
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

        const path = `/v1/integration/${integrationName}/Patient?_sort=-address-city`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].address[0].city).toBe('Cabo');
        expect(response.body.entry[1].address[0].city).toBe('Berlin');
        expect(response.body.entry[2].address[0].city).toBe('Amsterdam');
      });

      it('sorts by additionalData.primaryContactNumber ascending (telecom)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
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

        const path = `/v1/integration/${integrationName}/Patient?_sort=telecom`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].telecom[0].value).toBe('123456781');
        expect(response.body.entry[1].telecom[0].value).toBe('123456782');
        expect(response.body.entry[2].telecom[0].value).toBe('123456783');
      });

      it('sorts by additionalData.primaryContactNumber descending (-telecom)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
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

        const path = `/v1/integration/${integrationName}/Patient?_sort=-telecom`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].telecom[0].value).toBe('123456783');
        expect(response.body.entry[1].telecom[0].value).toBe('123456782');
        expect(response.body.entry[2].telecom[0].value).toBe('123456781');
      });

      it('sorts by multiple fields', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree, patientFour, patientFive] = await Promise.all([
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

        // Sort by firstName ascending, lastName descending, primaryContactNumber ascending
        const path = `/v1/integration/${integrationName}/Patient?_sort=given,-family,telecom`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(5);
        // Numbers don't repeat so everything else should be in place
        expect(response.body.entry[0].telecom[0].value).toBe('123456783');
        expect(response.body.entry[1].telecom[0].value).toBe('123456781');
        expect(response.body.entry[2].telecom[0].value).toBe('123456782');
        expect(response.body.entry[3].telecom[0].value).toBe('123456785');
        expect(response.body.entry[4].telecom[0].value).toBe('123456784');
      });
    });

    describe('filters search', () => {
      beforeEach(async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        await Patient.destroy({ where: {} });
        await PatientAdditionalData.destroy({ where: {} });
      });

      it('filters patient by displayId (identifier)', async () => {
        const { Patient } = ctx.store.models;
        const [patientOne] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        const identifier = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patientOne.displayId}`);
        const path = `/v1/integration/${integrationName}/Patient?identifier=${identifier}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(1);
      });

      it('filters patients by firstName (given)', async () => {
        const { Patient } = ctx.store.models;
        const firstName = 'John';
        await Promise.all([
          Patient.create(fake(Patient, { firstName })),
          Patient.create(fake(Patient, { firstName })),
          Patient.create(fake(Patient, { firstName: 'Bob' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?given=${firstName}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by lastName (family)', async () => {
        const { Patient } = ctx.store.models;
        const lastName = 'Doe';
        await Promise.all([
          Patient.create(fake(Patient, { lastName })),
          Patient.create(fake(Patient, { lastName })),
          Patient.create(fake(Patient, { lastName: 'Gray' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?family=${lastName}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by sex (gender)', async () => {
        const { Patient } = ctx.store.models;
        const sex = 'other';
        await Promise.all([
          Patient.create(fake(Patient, { sex })),
          Patient.create(fake(Patient, { sex })),
          Patient.create(fake(Patient, { sex: 'female' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?gender=${sex}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by dateOfBirth (birthdate)', async () => {
        const { Patient } = ctx.store.models;
        const dateOfBirth = '1990-05-25';
        await Promise.all([
          Patient.create(fake(Patient, { dateOfBirth })),
          Patient.create(fake(Patient, { dateOfBirth })),
          Patient.create(fake(Patient, { dateOfBirth: '1985-10-20' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?birthdate=${dateOfBirth}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by being deceased or not (deceased)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient, { dateOfDeath: getCurrentDateString() })),
        ]);

        // Query deceased=true
        const pathTrue = `/v1/integration/${integrationName}/Patient?deceased=true`;
        const responseTrue = await app.get(pathTrue).set(requestHeaders);

        expect(responseTrue).toHaveSucceeded();
        expect(responseTrue.body.total).toBe(1);

        // Query deceased=false
        const pathFalse = `/v1/integration/${integrationName}/Patient?deceased=false`;
        const responseFalse = await app.get(pathFalse).set(requestHeaders);

        expect(responseFalse).toHaveSucceeded();
        expect(responseFalse.body.total).toBe(2);
      });

      it('filters patients by additionalData.cityTown (address-city)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
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

        const path = `/v1/integration/${integrationName}/Patient?address-city=${cityTown}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      test.todo('filtering by address looks up a bunch of fields');
      test.todo('filtering by telecom looks up a bunch of fields');

      // This test can be replaced after address is able to look up several fields
      it('filtering by address only looks up additionalData.cityTown', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
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

        const path = `/v1/integration/${integrationName}/Patient?address=${cityTown}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      // This test can be replaced after telecom is able to look up several fields
      it('filtering by telecom only looks up additionalData.primaryContactNumber', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        const primaryContactNumber = '123456789';
        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '987654321' }),
            patientId: patientThree.id,
          }),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?telecom=${primaryContactNumber}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patient by visibilityStatus (active)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient, { visibilityStatus: 'whatever' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?active=true`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(1);
      });

      it('filters patients by params with supported modifiers', async () => {
        const { Patient } = ctx.store.models;
        const firstName = 'Jane';
        await Promise.all([
          Patient.create(fake(Patient, { firstName })),
          Patient.create(fake(Patient, { firstName })),
          Patient.create(fake(Patient, { firstName: 'Alice' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?given:contains=${firstName.slice(
          1,
          3,
        )}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by combining params and modifiers (all need to match)', async () => {
        const { Patient } = ctx.store.models;
        const firstName = 'Jane';
        const lastName = 'Doe';
        const dateOfBirth = '1990-05-20';
        await Promise.all([
          Patient.create(fake(Patient, { firstName, lastName, dateOfBirth })),
          Patient.create(fake(Patient, { firstName, lastName, dateOfBirth })),
          Patient.create(fake(Patient, { firstName: 'Alice', lastName, dateOfBirth })),
        ]);

        const slicedName = firstName.slice(1, 3);
        const path = `/v1/integration/${integrationName}/Patient?given:contains=${slicedName}&family=${lastName}&birthdate=${dateOfBirth}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });
    });

    describe('failure', () => {
      it('returns a 422 error when passed the wrong query params', async () => {
        // arrange
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(fake(Patient));
        await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        const id = encodeURIComponent(`not-the-right-identifier|${patient.displayId}`);
        const path = `/v1/integration/${integrationName}/Patient?_sort=id&_page=z&_count=x&subject%3Aidentifier=${id}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveRequestError(422);
        expect(response.body).toMatchObject({
          error: {
            errors: [
              'subject:identifier must be in the format "<namespace>|<id>"',
              '_count must be a `number` type, but the final value was: `NaN` (cast from the value `"x"`).',
              '_page must be a `number` type, but the final value was: `NaN` (cast from the value `"z"`).',
              'Unsupported or unknown parameters in _sort',
            ],
          },
        });
      });

      it('returns a 422 if there are any unknown patient params', async () => {
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
        expect(response).toHaveRequestError(422);
        expect(response.body).toMatchObject({
          error: {
            errors: ['Unknown or unsupported parameters: whatever'],
          },
        });
      });
    });
  });
}
