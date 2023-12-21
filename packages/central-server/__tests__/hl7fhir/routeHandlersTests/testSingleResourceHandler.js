import { format } from 'date-fns';

import { fake } from '@tamanu/shared/test-helpers/fake';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import { createTestContext } from 'sync-server/__tests__/utilities';

export function testSingleResourceHandler(integrationName, requestHeaders = {}) {
  describe(`${integrationName} integration - Single resource`, () => {
    let ctx;
    let app;
    beforeAll(async () => {
      ctx = await createTestContext(requestHeaders['X-Tamanu-Client']);
      app = await ctx.baseApp.asRole('practitioner');
    });
    afterAll(() => ctx.close());

    describe('Patient', () => {
      it('fetches a patient resource', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(
          fake(Patient, { dateOfDeath: getCurrentDateString() }),
        );
        const additionalData = await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        await patient.reload();

        const path = `/v1/integration/${integrationName}/Patient/${patient.id}`;
        const response = await app.get(path).set(requestHeaders);
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
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
        });
      });

      it('returns a 422 error when the resource does not exist', async () => {
        const nonExistingId = '1234567890';
        const path = `/v1/integration/${integrationName}/Patient/${nonExistingId}`;
        const response = await app.get(path).set(requestHeaders);
        expect(response).toHaveRequestError(422);
        expect(response.body).toMatchObject({
          error: {
            message: `Unable to find resource ${nonExistingId}`,
            name: 'NotFoundError',
          },
        });
      });
    });
  });
}
