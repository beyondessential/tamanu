import { VISIBILITY_STATUSES } from 'shared/constants';
import { fake } from 'shared/test-helpers/fake';

import { createTestContext } from '../../utilities';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - Patient Merge`, () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('merges', () => {
    let ids;

    // a <- b <- c
    //      b <- d
    beforeEach(async () => {
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

      await FhirPatient.resolveUpstreams();

      ids = { a, b, c, d };
      // console.log({
      //   [a]: primaryA.id,
      //   [b]: mergedB.id,
      //   [c]: mergedC.id,
      //   [d]: mergedD.id,
      // });
    });

    // Flaky test (EPI-275)
    it.skip('links patients that were merged into the top level patient A (as fetch)', async () => {
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Patient/${ids.a}`;

      // act
      const response = await app.get(path);

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

    // Flaky test (EPI-275)
    it.skip('links patients that were merged into, and patients that replaced, the mid level patient B (as fetch)', async () => {
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Patient/${ids.b}`;

      // act
      const response = await app.get(path);

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
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Patient?_id=${ids.c},${ids.d}`;

      // act
      const response = await app.get(path);

      // assert
      const resourceC = response.body?.entry?.find(({ resource }) => resource.id === ids.c)
        ?.resource;
      const resourceD = response.body?.entry?.find(({ resource }) => resource.id === ids.d)
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

  describe('merges with gradual materialisation', () => {
    let ids;

    // a <- b <- c
    //      b <- d
    beforeEach(async () => {
      const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
      await FhirPatient.destroy({ where: {} });
      await Patient.destroy({ where: {} });
      await PatientAdditionalData.destroy({ where: {} });

      const primaryA = await Patient.create(
        fake(Patient, {
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        }),
      );
      const { id: a } = await FhirPatient.materialiseFromUpstream(primaryA.id);

      const mergedB = await Patient.create(
        fake(Patient, {
          visibilityStatus: VISIBILITY_STATUSES.MERGED,
          mergedIntoId: primaryA.id,
        }),
      );
      const { id: b } = await FhirPatient.materialiseFromUpstream(mergedB.id);

      const mergedC = await Patient.create(
        fake(Patient, {
          visibilityStatus: VISIBILITY_STATUSES.MERGED,
          mergedIntoId: mergedB.id,
        }),
      );
      const { id: c } = await FhirPatient.materialiseFromUpstream(mergedC.id);

      const mergedD = await Patient.create(
        fake(Patient, {
          visibilityStatus: VISIBILITY_STATUSES.MERGED,
          mergedIntoId: mergedB.id,
        }),
      );
      const { id: d } = await FhirPatient.materialiseFromUpstream(mergedD.id);

      await FhirPatient.resolveUpstreams();

      ids = { a, b, c, d };
      // console.log({
      //   [a]: primaryA.id,
      //   [b]: mergedB.id,
      //   [c]: mergedC.id,
      //   [d]: mergedD.id,
      // });
    });

    it('links patients that were merged into the top level patient A (as fetch)', async () => {
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Patient/${ids.a}`;

      // act
      const response = await app.get(path);

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

    // Flaky test (EPI-275)
    it.skip('links patients that were merged into, and patients that replaced, the mid level patient B (as fetch)', async () => {
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Patient/${ids.b}`;

      // act
      const response = await app.get(path);

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
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Patient?_id=${ids.c},${ids.d}`;

      // act
      const response = await app.get(path);

      // assert
      const resourceC = response.body?.entry?.find(({ resource }) => resource.id === ids.c)
        ?.resource;
      const resourceD = response.body?.entry?.find(({ resource }) => resource.id === ids.d)
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
