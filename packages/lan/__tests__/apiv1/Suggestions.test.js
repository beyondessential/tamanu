import { SURVEY_TYPES, VISIBILITY_STATUSES, LOCATION_AVAILABILITY_STATUS } from 'shared/constants';
import {
  splitIds,
  buildDiagnosis,
  createDummyPatient,
  createDummyEncounter,
  randomRecords,
} from 'shared/demoData';
import { findOneOrCreate } from 'shared/test-helpers';
import { createTestContext } from '../utilities';
import { testDiagnoses } from '../seed';

describe('Suggestions', () => {
  let userApp = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    userApp = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('Patients', () => {
    let searchPatient;

    beforeAll(async () => {
      searchPatient = await models.Patient.create(
        await createDummyPatient(models, {
          firstName: 'Test',
          lastName: 'Appear',
          displayId: 'abcabc123123',
        }),
      );
      await models.Patient.create(
        await createDummyPatient(models, {
          firstName: 'Negative',
          lastName: 'Negative',
          displayId: 'negative',
        }),
      );
    });

    it('should get a patient by first name', async () => {
      const result = await userApp.get('/v1/suggestions/patient').query({ q: 'Test' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveLength(1);
      expect(body[0]).toHaveProperty('id', searchPatient.id);
    });

    it('should get a patient by last name', async () => {
      const result = await userApp.get('/v1/suggestions/patient').query({ q: 'Appear' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveProperty('length', 1);
      expect(body[0]).toHaveProperty('id', searchPatient.id);
    });

    it('should get a patient by combined first and last name', async () => {
      const result = await userApp.get('/v1/suggestions/patient').query({ q: 'Test Appear' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveProperty('length', 1);
      expect(body[0]).toHaveProperty('id', searchPatient.id);
    });

    it('should get a patient by displayId', async () => {
      const result = await userApp.get('/v1/suggestions/patient').query({ q: 'abcabc123123' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveProperty('length', 1);
      expect(body[0]).toHaveProperty('id', searchPatient.id);
    });

    it('should not get patients without permission', async () => {
      const result = await baseApp.get('/v1/suggestions/patient').query({ q: 'anything' });
      expect(result).toBeForbidden();
    });
  });

  // Locations suggester has specialised functionality for determining location availability
  describe('Locations', () => {
    let occupiedLocation;
    let reservedLocation;
    let unrestrictedLocation;

    beforeAll(async () => {
      [occupiedLocation, reservedLocation, unrestrictedLocation] = await randomRecords(
        models,
        'Location',
        3,
      );

      await unrestrictedLocation.update({ maxOccupancy: null });

      // An encounter requires a patient
      const patient = await models.Patient.create(
        await createDummyPatient(models, {
          firstName: 'Lauren',
          lastName: 'Ipsum',
          displayId: 'lorem',
        }),
      );
      // mark one location as occupied, and one as reserved
      await models.Encounter.create(
        await createDummyEncounter(models, {
          patientId: patient.id,
          locationId: occupiedLocation.id,
          plannedLocationId: reservedLocation.id,
          endDate: null,
        }),
      );
      // mark unrestricted location as occupied
      await models.Encounter.create(
        await createDummyEncounter(models, {
          patientId: patient.id,
          locationId: unrestrictedLocation.id,
          plannedLocationId: null,
          endDate: null,
        }),
      );
    });

    afterAll(async () => {
      await unrestrictedLocation.update({ maxOccupancy: 1 });
    });

    it('should calculate location availability and return it with suggestion list', async () => {
      const result = await userApp.get('/v1/suggestions/location');
      expect(result).toHaveSucceeded();

      const { body } = result;

      const occupiedResult = body.find(x => x.id === occupiedLocation.id);
      expect(occupiedResult).toHaveProperty('availability', LOCATION_AVAILABILITY_STATUS.OCCUPIED);

      const reservedResult = body.find(x => x.id === reservedLocation.id);
      expect(reservedResult).toHaveProperty('availability', LOCATION_AVAILABILITY_STATUS.RESERVED);

      const unrestrictedResult = body.find(x => x.id === unrestrictedLocation.id);
      expect(unrestrictedResult).toHaveProperty(
        'availability',
        LOCATION_AVAILABILITY_STATUS.AVAILABLE,
      );

      const otherResults = body.filter(
        x => ![occupiedLocation.id, reservedLocation.id, unrestrictedLocation.id].includes(x.id),
      );
      for (const location of otherResults) {
        expect(location).toHaveProperty('availability', LOCATION_AVAILABILITY_STATUS.AVAILABLE);
      }
    });

    it('should filter locations by location group', async () => {
      await models.Location.truncate({ cascade: true });

      const locationGroup = await findOneOrCreate(models, models.LocationGroup, {
        id: 'test-area',
        name: 'Test Area',
      });
      await findOneOrCreate(models, models.Location, {
        name: 'Bed 1',
        locationGroupId: locationGroup.id,
        visibilityStatus: 'current',
      });
      await findOneOrCreate(models, models.Location, {
        name: 'Bed 2',
        locationGroupId: locationGroup.id,
        visibilityStatus: 'current',
      });
      await findOneOrCreate(models, models.Location, {
        name: 'Bed 3',
        visibilityStatus: 'current',
      });
      const result = await userApp.get('/v1/suggestions/location');
      expect(result).toHaveSucceeded();
      expect(result?.body?.length).toEqual(3);

      const filteredResult = await userApp.get(
        '/v1/suggestions/location?locationGroupId=test-area',
      );
      expect(filteredResult).toHaveSucceeded();
      expect(filteredResult?.body?.length).toEqual(2);
    });

    it('should return facilityId with suggestion list', async () => {
      await models.Location.truncate({ cascade: true });
      const facility = await models.Facility.create({
        id: 'test-facility',
        code: 'test-facility',
        name: 'Test Facility',
      });
      const locationGroup = await findOneOrCreate(models, models.LocationGroup, {
        id: 'test-area',
        name: 'Test Area',
      });
      await findOneOrCreate(models, models.Location, {
        name: 'Bed 1',
        locationGroupId: locationGroup.id,
        visibilityStatus: 'current',
        facilityId: facility.id,
      });
      const result = await userApp.get('/v1/suggestions/location');
      expect(result).toHaveSucceeded();
      expect(result?.body?.length).toEqual(1);
      expect(result.body[0].facilityId).toEqual(facility.id);
    });
  });

  describe('General functionality (via diagnoses)', () => {
    const limit = 25;

    it('should get a default list of suggestions with an empty query', async () => {
      const result = await userApp.get('/v1/suggestions/icd10');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(limit);
    });

    it('should get a full list of diagnoses with a general query', async () => {
      const result = await userApp.get('/v1/suggestions/icd10?q=A');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(limit);
    });

    it('should get a partial list of diagnoses with a specific query', async () => {
      const count = testDiagnoses.filter(td => td.name.toLowerCase().includes('bacterial')).length;
      expect(count).toBeLessThan(limit); // ensure we're actually testing filtering!
      const result = await userApp.get('/v1/suggestions/icd10?q=bacterial');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(count);
    });

    it('should not be case sensitive', async () => {
      const result = await userApp.get('/v1/suggestions/icd10?q=pNeUmOnIa');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBeGreaterThan(0);
    });

    it('should look up a specific suggestion', async () => {
      const record = await models.ReferenceData.findOne();
      const result = await userApp.get(`/v1/suggestions/icd10/${record.id}`);
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toHaveProperty('name', record.name);
      expect(body).toHaveProperty('id', record.id);
    });

    it('should get suggestions for a medication', async () => {
      const result = await userApp.get('/v1/suggestions/drug?q=a');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBeGreaterThan(0);
    });

    it('should get suggestions for a survey', async () => {
      const programId = 'all-survey-program-id';
      const obsoleteSurveyId = 'obsolete-survey-id';
      await models.Program.create({
        id: programId,
        name: 'Program',
      });

      await models.Survey.bulkCreate([
        {
          id: obsoleteSurveyId,
          programId,
          name: 'XX - Obsolete Survey',
          surveyType: SURVEY_TYPES.OBSOLETE,
        },
        {
          id: 'referral-survey-id',
          programId,
          name: 'XX - Referral Survey',
        },
        {
          id: 'program-survey-id',
          programId,
          name: 'XX - Program Survey',
        },
        {
          id: 'program-survey-id-2',
          programId,
          name: 'ZZ - Program Survey',
        },
      ]);

      const result = await userApp.get('/v1/suggestions/survey?q=X');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBe(2);
      const idArray = body.map(({ id }) => id);
      expect(idArray).not.toContain(obsoleteSurveyId);
    });
  });

  describe('Order of results (via diagnoses)', () => {
    // Applies only to tests in this describe block
    beforeEach(() => {
      return models.ReferenceData.truncate({ cascade: true });
    });

    it('should return results that start with the query first', async () => {
      const testData = splitIds(`
        Acute bacterial infection	A49.9
        Chronic constipation	K59.0
        Constipation	K59.0
        Simple constipation	K59.0
        Unconscious	R40.2
      `).map(buildDiagnosis);

      await models.ReferenceData.bulkCreate(testData);

      const result = await userApp.get('/v1/suggestions/icd10?q=cons');
      expect(result).toHaveSucceeded();
      const { body } = result;
      const firstResult = body[0];
      const lastResult = body[body.length - 1];

      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBeGreaterThan(0);

      expect(firstResult.name).toEqual('Constipation');
      expect(lastResult.name).toEqual('Unconscious');
    });

    it('should return results alphabetically when the position of the search query is the same', async () => {
      const testData = splitIds(`
        Acute viral gastroenteritis	A09.9
        Acute myeloid leukaemia	C92.0
        Acute bronchiolitis	J21.9
        Acute stress disorder	F43.0
        Acute vulvitis	N76.2
        Acute gout attack	M10.9
        Acute tubular necrosis	N17.0
        Acute axillary lymphadenitis	L04.2
        Acute mastitis	N61
        Acute bronchitis	J20.9
      `).map(buildDiagnosis);

      await models.ReferenceData.bulkCreate(testData);

      const result = await userApp.get('/v1/suggestions/icd10?q=acute');
      expect(result).toHaveSucceeded();
      const { body } = result;

      const sortedTestData = testData.sort((a, b) => a.name.localeCompare(b.name));
      expect(body.map(({ name }) => name)).toEqual(sortedTestData.map(({ name }) => name));
    });
  });

  it('should respect visibility status', async () => {
    const visible = await models.ReferenceData.create({
      type: 'allergy',
      name: 'visibility YES',
      code: 'visible_allergy',
    });
    const invisible = await models.ReferenceData.create({
      type: 'allergy',
      name: 'visibility NO',
      code: 'invisible_allergy',
      visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
    });

    const result = await userApp.get('/v1/suggestions/allergy?q=visibility');
    expect(result).toHaveSucceeded();
    const { body } = result;

    const idArray = body.map(({ id }) => id);
    expect(idArray).toContain(visible.id);
    expect(idArray).not.toContain(invisible.id);
  });

  it('Should get all suggestions on the /all endpoint', async () => {
    await models.ReferenceData.truncate({ cascade: true });
    const dummyRecords = (new Array(30)).fill(0).map((_, i) => ({
      id: `diag-${i}`,
      type: 'icd10',
      name: `Diag ${i}`,
      code: `diag-${i}`,
    }));

    await models.ReferenceData.bulkCreate(dummyRecords);
    const result = await userApp.get('/v1/suggestions/icd10/all');
    expect(result).toHaveSucceeded();
    expect(result.body).toHaveLength(30);
  });
});
