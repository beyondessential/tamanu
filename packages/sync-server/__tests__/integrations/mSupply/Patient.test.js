import { format } from 'date-fns';
import moment from 'moment';

import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { IDENTIFIER_NAMESPACE } from '../../../app/hl7fhir/utils';

describe('mSupply integration - Patient', () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('success', () => {
    it('fetches a patient', async () => {
      // arrange
      const { Patient, PatientAdditionalData } = ctx.store.models;
      const patient = await Patient.create(fake(Patient, { dateOfDeath: new Date() }));
      const additionalData = await PatientAdditionalData.create({
        ...fake(PatientAdditionalData),
        patientId: patient.id,
      });
      await patient.reload(); // saving PatientAdditionalData updates the patient too
      const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
      const path = `/v1/integration/mSupply/Patient?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

      // act
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: 'patients',
        meta: {
          lastUpdated: patient.updatedAt.toISOString(),
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
            active: true,
            address: [
              {
                city: additionalData.cityTown,
                line: [additionalData.streetVillage],
                type: 'physical',
                use: 'home',
              },
            ],
            birthDate: format(patient.dateOfBirth, 'yyyy-MM-dd'),
            deceasedDateTime: format(patient.dateOfDeath, "yyyy-MM-dd'T'HH:mm:ssXXX"),
            gender: patient.sex,
            identifier: [
              {
                use: 'usual',
                value: patient.id,
              },
              {
                assigner: 'Tamanu',
                system: 'http://tamanu.io/data-dictionary/application-reference-number.html',
                use: 'official',
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
      const path = `/v1/integration/mSupply/Patient?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

      // act
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: 'patients',
        meta: {
          lastUpdated: null,
        },
        type: 'searchset',
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
      const path = `/v1/integration/mSupply/Patient`;

      // act
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body.total).toBe(2);
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
      const path = `/v1/integration/mSupply/Patient?identifier=${identifier}`;
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

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

      const path = `/v1/integration/mSupply/Patient?given=${firstName}`;
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

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

      const path = `/v1/integration/mSupply/Patient?family=${lastName}`;
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

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

      const path = `/v1/integration/mSupply/Patient?gender=${sex}`;
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

      expect(response).toHaveSucceeded();
      expect(response.body.total).toBe(2);
    });

    it('filters patients by dateOfBirth (birthdate)', async () => {
      const { Patient } = ctx.store.models;
      const dateString = '1990-05-25';
      const dateOfBirth = moment.utc(dateString);
      await Promise.all([
        Patient.create(fake(Patient, { dateOfBirth })),
        Patient.create(fake(Patient, { dateOfBirth })),
        Patient.create(fake(Patient, { dateOfBirth: moment.utc('1985-10-20') })),
      ]);

      const path = `/v1/integration/mSupply/Patient?birthdate=${dateString}`;
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

      expect(response).toHaveSucceeded();
      expect(response.body.total).toBe(2);
    });

    it('filters patients by being deceased or not (deceased)', async () => {
      const { Patient } = ctx.store.models;
      await Promise.all([
        Patient.create(fake(Patient)),
        Patient.create(fake(Patient)),
        Patient.create(fake(Patient, { dateOfDeath: moment.utc() })),
      ]);

      // Query deceased=true
      const pathTrue = '/v1/integration/mSupply/Patient?deceased=true';
      const responseTrue = await app
        .get(pathTrue)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

      expect(responseTrue).toHaveSucceeded();
      expect(responseTrue.body.total).toBe(1);

      // Query deceased=false
      const pathFalse = '/v1/integration/mSupply/Patient?deceased=false';
      const responseFalse = await app
        .get(pathFalse)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

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
      const [a, b, c] = await Promise.all([
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

      const path = `/v1/integration/mSupply/Patient?address-city=${cityTown}`;
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

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

      const path = `/v1/integration/mSupply/Patient?address=${cityTown}`;
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

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

      const path = `/v1/integration/mSupply/Patient?telecom=${primaryContactNumber}`;
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

      expect(response).toHaveSucceeded();
      expect(response.body.total).toBe(2);
    });

    it('filters patients by params with supported modifiers', async () => {
      const { Patient } = ctx.store.models;
      const firstName = 'Jane';
      await Promise.all([
        Patient.create(fake(Patient, { firstName })),
        Patient.create(fake(Patient, { firstName })),
        Patient.create(fake(Patient, { firstName: 'Alice' })),
      ]);

      const path = `/v1/integration/mSupply/Patient?given:contains=${firstName.slice(1, 3)}`;
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

      expect(response).toHaveSucceeded();
      expect(response.body.total).toBe(2);
    });

    it('filters patients by combining params and modifiers (all need to match)', async () => {
      const { Patient } = ctx.store.models;
      const firstName = 'Jane';
      const lastName = 'Doe';
      const dateString = '1990-05-20';
      const dateOfBirth = moment.utc(dateString);
      await Promise.all([
        Patient.create(fake(Patient, { firstName, lastName, dateOfBirth })),
        Patient.create(fake(Patient, { firstName, lastName, dateOfBirth })),
        Patient.create(fake(Patient, { firstName: 'Alice', lastName, dateOfBirth })),
      ]);

      const path = `/v1/integration/mSupply/Patient?given:contains=${firstName.slice(1, 3)}&family=${lastName}&birthdate=${dateString}`;
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

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
      const path = `/v1/integration/mSupply/Patient?_sort=id&_page=z&_count=x&status=initial&subject%3Aidentifier=${id}`;

      // act
      const response = await app
        .get(path)
        .set({ 'X-Tamanu-Client': 'mSupply', 'X-Version': '0.0.1' });

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
  });
});
