import { format } from 'date-fns';

import { fake } from '@tamanu/shared/test-helpers/fake';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';

import { createTestContext } from '../../utilities';
import { IDENTIFIER_NAMESPACE } from '../../../dist/hl7fhir/utils';

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
      it('handles a bundle', async () => {
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
        const path = `/api/integration/${integrationName}`;

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
          ],
        });
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
        const path = `/api/integration/${integrationName}/Patient?_sort=id&_page=z&_count=x&subject%3Aidentifier=${id}`;

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

    });
  });
}
