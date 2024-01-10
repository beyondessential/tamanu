/* eslint-disable no-unused-expressions */

import { addDays, getYear } from 'date-fns';

import { fake, chance } from '@tamanu/shared/test-helpers';
import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { FHIR_DATETIME_PRECISION } from '@tamanu/constants';
import { formatFhirDate } from '@tamanu/shared/utils/fhir/datetime';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { createTestContext } from '../../utilities';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - Encounter`, () => {
  let ctx;
  let app;
  let resources;

  const originalDate = new Date(`${getYear(new Date()) + 1}-01-01`);
  let creationDate = addDays(originalDate, 1);

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');

    const {
      Department,
      Facility,
      Location,
      LocationGroup,
      Patient,
      User,
      FhirPatient,
    } = ctx.store.models;

    const [practitioner, patient, facility] = await Promise.all([
      User.create(fake(User)),
      Patient.create(fake(Patient)),
      Facility.create(fake(Facility)),
    ]);

    const locationGroup = await LocationGroup.create(
      fake(LocationGroup, { facilityId: facility.id }),
    );

    const [location, matPatient] = await Promise.all([
      Location.create(
        fake(Location, { facilityId: facility.id, locationGroupId: locationGroup.id }),
      ),
      FhirPatient.materialiseFromUpstream(patient.id),
    ]);

    const department = await Department.create(
      fake(Department, { facilityId: facility.id, locationId: location.id }),
    );

    resources = {
      department,
      practitioner,
      patient,
      facility,
      location,
      locationGroup,
      matPatient,
    };
  });
  afterAll(() => ctx.close());

  async function makeEncounter(overrides = {}, beforeMaterialising = () => {}) {
    const { Encounter, FhirEncounter } = ctx.store.models;

    const startDate = new Date(chance.integer({ min: 0, max: Date.now() }));
    const endDate = new Date(chance.integer({ min: startDate.getTime() + 1, max: Date.now() }));

    const encounter = await Encounter.create(
      fake(Encounter, {
        patientId: resources.patient.id,
        locationId: resources.location.id,
        departmentId: resources.department.id,
        examinerId: resources.practitioner.id,
        startDate: toDateTimeString(startDate),
        ...overrides,
      }),
    );

    await beforeMaterialising(encounter, toDateTimeString(endDate));
    await ctx.store.sequelize.query('UPDATE encounters SET updated_at = $1 WHERE id = $2', {
      bind: [formatFhirDate(creationDate, FHIR_DATETIME_PRECISION.DAYS), encounter.id],
    });
    creationDate = addDays(creationDate, 1);

    const mat = await FhirEncounter.materialiseFromUpstream(encounter.id);
    await FhirEncounter.resolveUpstreams();

    return [encounter, mat];
  }

  function makeDischargedEncounter(overrides = {}, beforeMaterialising = () => {}) {
    return makeEncounter(overrides, async (encounter, endDate) => {
      const { Discharge } = ctx.store.models;
      encounter.set('endDate', endDate);
      await encounter.save();
      const discharge = await Discharge.create(
        fake(Discharge, {
          updatedAt: creationDate,
          encounterId: encounter.id,
        }),
      );

      await ctx.store.sequelize.query('UPDATE discharges SET updated_at = $1 WHERE id = $2', {
        bind: [formatFhirDate(creationDate, FHIR_DATETIME_PRECISION.DAYS), discharge.id],
      });
      creationDate = addDays(creationDate, 1);

      return beforeMaterialising(encounter, endDate);
    });
  }

  describe('materialise', () => {
    beforeEach(async () => {
      const { Encounter, Discharge, FhirEncounter } = ctx.store.models;
      await Discharge.destroy({ where: {} });
      await FhirEncounter.destroy({ where: {} });
      await Encounter.destroy({ where: {} });
    });

    it('an encounter', async () => {
      // arrange
      const [, mat] = await makeEncounter({
        encounterType: 'emergency',
      });

      // act
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Encounter/${mat.id}`;
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'Encounter',
        id: expect.any(String),
        meta: {
          lastUpdated: expect.any(String),
        },
        status: 'in-progress',
        class: [
          {
            coding: [
              {
                code: 'EMER',
                display: 'emergency',
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              },
            ],
          },
        ],
        subject: {
          reference: `Patient/${resources.matPatient.id}`,
          type: 'Patient',
          display: `${resources.patient.firstName} ${resources.patient.lastName}`,
        },
        location: [
          {
            location: {
              display: resources.locationGroup.name,
              id: resources.locationGroup.id,
            },
            status: 'active',
            physicalType: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/location-physical-type',
                  code: 'wa',
                  display: 'Ward',
                },
              ],
            },
          },
          {
            location: {
              display: resources.location.name,
              id: resources.location.id,
            },
            status: 'active',
            physicalType: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/location-physical-type',
                  code: 'bd',
                  display: 'Bed',
                },
              ],
            },
          },
        ],
      });
      expect(response).toHaveSucceeded();
    });

    it('a discharged encounter', async () => {
      // arrange
      const [, mat] = await makeDischargedEncounter({
        encounterType: 'clinic',
      });

      // act
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Encounter/${mat.id}`;
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'Encounter',
        id: expect.any(String),
        meta: {
          lastUpdated: expect.any(String),
        },
        status: 'discharged',
        class: [
          {
            coding: [
              {
                code: 'IMP',
                display: 'inpatient encounter',
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              },
            ],
          },
        ],
        subject: {
          reference: `Patient/${resources.matPatient.id}`,
          type: 'Patient',
          display: `${resources.patient.firstName} ${resources.patient.lastName}`,
        },
      });
      expect(response).toHaveSucceeded();
    });
  });

  describe('search', () => {
    const encounters = [];
    beforeAll(async () => {
      const { Encounter, Discharge, FhirEncounter } = ctx.store.models;
      await Discharge.destroy({ where: {} });
      await FhirEncounter.destroy({ where: {} });
      await Encounter.destroy({ where: {} });

      creationDate = addDays(originalDate, 1);

      encounters.push(await makeEncounter({ encounterType: 'admission' }));
      encounters.push(await makeEncounter({ encounterType: 'clinic' }));
      encounters.push(await makeEncounter({ encounterType: 'emergency' }));
      encounters.push(await makeEncounter({ encounterType: 'imaging' }));
      encounters.push(await makeEncounter({ encounterType: 'observation' }));
      encounters.push(await makeEncounter({ encounterType: 'triage' }));

      encounters.push(await makeDischargedEncounter({ encounterType: 'admission' }));
      encounters.push(await makeDischargedEncounter({ encounterType: 'clinic' }));
      encounters.push(await makeDischargedEncounter({ encounterType: 'emergency' }));
      encounters.push(await makeDischargedEncounter({ encounterType: 'imaging' }));
      encounters.push(await makeDischargedEncounter({ encounterType: 'observation' }));
      encounters.push(await makeDischargedEncounter({ encounterType: 'triage' }));
    });

    it('returns a list when passed no query params', async () => {
      const response = await app.get(`/v1/integration/${INTEGRATION_ROUTE}/Encounter`);

      expect(response.body.total).toBe(12);
      expect(response.body.entry).toHaveLength(12);
      expect(response).toHaveSucceeded();
    });

    describe('sorts', () => {
      it('by lastUpdated ascending', async () => {
        const response = await app.get(
          `/v1/integration/${INTEGRATION_ROUTE}/Encounter?_sort=_lastUpdated`,
        );

        expect(response.body.total).toBe(12);
        expect(response.body.entry.map(entry => entry.resource.id)).toEqual(
          encounters.map(([, mat]) => mat.id),
        );
        expect(response).toHaveSucceeded();
      });

      it('by lastUpdated descending', async () => {
        const response = await app.get(
          `/v1/integration/${INTEGRATION_ROUTE}/Encounter?_sort=-_lastUpdated`,
        );

        expect(response.body.total).toBe(12);
        expect(response.body.entry.map(entry => entry.resource.id)).toEqual(
          encounters.map(([, mat]) => mat.id).reverse(),
        );
        expect(response).toHaveSucceeded();
      });

      it('by status', async () => {
        const response = await app.get(
          `/v1/integration/${INTEGRATION_ROUTE}/Encounter?_sort=status`,
        );

        expect(response.body.total).toBe(12);
        expect(
          response.body.entry
            .slice(0, 6)
            .map(entry => entry.resource.id)
            .sort(),
        ).toEqual(
          encounters
            .filter(([, mat]) => mat.status === 'discharged')
            .map(([, mat]) => mat.id)
            .sort(),
        );
        expect(
          response.body.entry
            .slice(6, 12)
            .map(entry => entry.resource.id)
            .sort(),
        ).toEqual(
          encounters
            .filter(([, mat]) => mat.status === 'in-progress')
            .map(([, mat]) => mat.id)
            .sort(),
        );
        expect(response).toHaveSucceeded();
      });
    });

    describe('filters', () => {
      it('by lastUpdated=gt', async () => {
        const [newEncounter, newMat] = await makeEncounter({ encounterType: 'emergency' });
        newMat.update({ lastUpdated: addDays(new Date(), 5) });
        const response = await app.get(
          `/v1/integration/${INTEGRATION_ROUTE}/Encounter?_lastUpdated=gt${encodeURIComponent(
            formatFhirDate(addDays(new Date(), 4)),
          )}`,
        );

        expect(response.body.total).toBe(1);
        expect(response.body.entry.map(ent => ent.resource.id)).toStrictEqual(
          [[newEncounter, newMat]].map(([, mat]) => mat.id),
        );
        expect(response).toHaveSucceeded();
      });

      it('by status', async () => {
        const response = await app.get(
          `/v1/integration/${INTEGRATION_ROUTE}/Encounter?status=discharged`,
        );

        expect(response.body.total).toBe(6);
        expect(response.body.entry.map(ent => ent.resource.id)).toStrictEqual(
          encounters.slice(6).map(([, mat]) => mat.id),
        );
        expect(response).toHaveSucceeded();
      });

      it('by class', async () => {
        const response = await app.get(`/v1/integration/${INTEGRATION_ROUTE}/Encounter?class=|IMP`);

        expect(response.body.total).toBe(6);
        expect(response.body.entry).toHaveLength(6);
        expect(response).toHaveSucceeded();
      });
    });
  });

  describe('errors', () => {
    it('returns not found when fetching a non-existent encounter', async () => {
      // arrange
      const id = fakeUUID();
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Encounter/${id}`;

      // act
      const response = await app.get(path);

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
              text: `no Encounter with id ${id}`,
            },
          },
        ],
      });
      expect(response.status).toBe(404);
    });

    it('returns an error if there are any unknown search params', async () => {
      // arrange
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Encounter?whatever=something`;

      // act
      const response = await app.get(path);

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
});
