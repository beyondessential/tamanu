import { fake, fakeReferenceData, fakeUser } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';

export function testImmunizationHandler(integrationName, requestHeaders = {}) {
  describe(`${integrationName} integration - Immunization`, () => {
    let ctx;
    let app;
    let models;

    const NON_SUPPORTED_VACCINE_ID = 'NON-SUPPORTED-ID';

    beforeAll(async () => {
      ctx = await createTestContext(requestHeaders['X-Tamanu-Client']);
      app = await ctx.baseApp.asRole('practitioner');
      models = ctx.store.models;

      // Create 3 different administered vaccine and related data
      const {
        User,
        Facility,
        Department,
        Location,
        ReferenceData,
        Patient,
        Encounter,
        ScheduledVaccine,
        AdministeredVaccine,
      } = models;

      const { id: patientId } = await Patient.create(fake(Patient));
      const { id: examinerId } = await User.create(fakeUser());
      const { id: facilityId } = await Facility.create(fake(Facility));
      const { id: departmentId } = await Department.create({ ...fake(Department), facilityId });
      const { id: locationId } = await Location.create({ ...fake(Location), facilityId });
      const { id: encounterId } = await Encounter.create({
        ...fake(Encounter),
        departmentId,
        locationId,
        patientId,
        examinerId,
        endDate: null,
      });

      const [vaccineOne, vaccineTwo, vaccineThree] = await Promise.all([
        ReferenceData.create({
          ...fakeReferenceData(),
          id: 'drug-COVAX',
          code: 'COVAX',
          type: 'drug',
          name: 'COVAX',
        }),
        ReferenceData.create({
          ...fakeReferenceData(),
          id: 'drug-COVID-19-Pfizer',
          code: 'PFIZER',
          type: 'drug',
          name: 'PFIZER',
        }),
        ReferenceData.create({
          ...fakeReferenceData(),
          id: NON_SUPPORTED_VACCINE_ID,
          code: 'NON-MATCH',
          type: 'drug',
          name: 'NON-MATCH',
        }),
      ]);

      const [scheduleOne, scheduleTwo, scheduleThree] = await Promise.all([
        ScheduledVaccine.create({
          ...fake(ScheduledVaccine),
          vaccineId: vaccineOne.id,
        }),
        ScheduledVaccine.create({
          ...fake(ScheduledVaccine),
          vaccineId: vaccineTwo.id,
        }),
        ScheduledVaccine.create({
          ...fake(ScheduledVaccine),
          vaccineId: vaccineThree.id,
        }),
      ]);

      await Promise.all([
        AdministeredVaccine.create({
          ...fake(AdministeredVaccine),
          status: 'GIVEN',
          date: new Date(),
          recorderId: examinerId,
          scheduledVaccineId: scheduleOne.id,
          encounterId,
        }),
        AdministeredVaccine.create({
          ...fake(AdministeredVaccine),
          status: 'GIVEN',
          date: new Date(),
          recorderId: examinerId,
          scheduledVaccineId: scheduleTwo.id,
          encounterId,
        }),
        AdministeredVaccine.create({
          ...fake(AdministeredVaccine),
          status: 'GIVEN',
          date: new Date(),
          recorderId: examinerId,
          scheduledVaccineId: scheduleThree.id,
          encounterId,
        }),
      ]);
    });
    afterAll(() => ctx.close());

    describe('success', () => {
      it("returns no error but no results when patient reference doesn't match", async () => {
        const id = '123456789';
        const path = `/v1/integration/${integrationName}/Immunization?_sort=-issued&_page=0&_count=2&patient=${id}`;
        const response = await app.get(path).set(requestHeaders);
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
          resourceType: 'Bundle',
          id: 'immunizations',
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

      it("returns no error but no results when vaccine code doesn't match", async () => {
        const path = `/v1/integration/${integrationName}/Immunization?_sort=-issued&_page=0&_count=2&vaccine-code=${NON_SUPPORTED_VACCINE_ID}`;
        const response = await app.get(path).set(requestHeaders);
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
          resourceType: 'Bundle',
          id: 'immunizations',
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

      it('returns a list of supported immunizations when passed no query params', async () => {
        const response = await app
          .get(`/v1/integration/${integrationName}/Immunization`)
          .set(requestHeaders);
        expect(response).toHaveSucceeded();
        // We created 3, but only 2 types of vaccine are supported to be included
        expect(response.body.total).toBe(2);
      });
    });

    describe('failure', () => {
      it('returns a 422 error when passed the wrong query params', async () => {
        const path = `/v1/integration/${integrationName}/Immunization?_sort=id&_page=z&_count=x&status=initial`;
        const response = await app.get(path).set(requestHeaders);
        expect(response).toHaveRequestError(422);
        expect(response.body).toMatchObject({
          error: {
            errors: [
              '_count must be a `number` type, but the final value was: `NaN` (cast from the value `"x"`).',
              '_page must be a `number` type, but the final value was: `NaN` (cast from the value `"z"`).',
              '_sort must be one of the following values: -issued, issued',
            ],
          },
        });
      });
    });
  });
}
