import {
  LAB_REQUEST_STATUSES,
  LOCATION_AVAILABILITY_STATUS,
  SURVEY_TYPES,
  VISIBILITY_STATUSES,
  REFERENCE_DATA_TRANSLATION_PREFIX,
} from '@tamanu/constants';
import {
  buildDiagnosis,
  createDummyEncounter,
  createDummyPatient,
  randomRecords,
  randomLabRequest,
  splitIds,
  randomSensitiveLabRequest,
} from '@tamanu/database/demoData';
import { findOneOrCreate } from '@tamanu/shared/test-helpers';
import { fake } from '@tamanu/fake-data/fake';
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
    let spaceySearchPatient;

    beforeAll(async () => {
      searchPatient = await models.Patient.create(
        await createDummyPatient(models, {
          firstName: 'Test',
          lastName: 'Appear',
          displayId: 'abcabc123123',
        }),
      );
      spaceySearchPatient = await models.Patient.create(
        await createDummyPatient(models, {
          firstName: 'Spacey ',
          lastName: 'Patient ',
          displayId: 'zxyzxy321321 ',
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
      const result = await userApp.get('/api/suggestions/patient').query({ q: 'Test' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveLength(1);
      expect(body[0]).toHaveProperty('id', searchPatient.id);
    });

    it('should get a patient by last name', async () => {
      const result = await userApp.get('/api/suggestions/patient').query({ q: 'Appear' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveProperty('length', 1);
      expect(body[0]).toHaveProperty('id', searchPatient.id);
    });

    it('should get a patient by combined first then last name', async () => {
      const result = await userApp.get('/api/suggestions/patient').query({ q: 'Test Appear' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveProperty('length', 1);
      expect(body[0]).toHaveProperty('id', searchPatient.id);
    });

    it('should get a patient by combined last then first name', async () => {
      const result = await userApp.get('/api/suggestions/patient').query({ q: 'Appear Test' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveProperty('length', 1);
      expect(body[0]).toHaveProperty('id', searchPatient.id);
    });

    it('should get a patient by combined first then last name when there is a space in the patient record', async () => {
      const result = await userApp.get('/api/suggestions/patient').query({ q: 'Spacey Patient' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveProperty('length', 1);
      expect(body[0]).toHaveProperty('id', spaceySearchPatient.id);
    });

    it('should get a patient by combined last then first name when there is a space in the patient record', async () => {
      const result = await userApp.get('/api/suggestions/patient').query({ q: 'Patient Spacey' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveProperty('length', 1);
      expect(body[0]).toHaveProperty('id', spaceySearchPatient.id);
    });

    it('should get a patient by displayId', async () => {
      const result = await userApp.get('/api/suggestions/patient').query({ q: 'abcabc123123' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveProperty('length', 1);
      expect(body[0]).toHaveProperty('id', searchPatient.id);
    });

    it('should get a patient by displayId when there is a space in the patient record', async () => {
      const result = await userApp.get('/api/suggestions/patient').query({ q: 'zxyzxy321321' });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toHaveProperty('length', 1);
      expect(body[0]).toHaveProperty('id', spaceySearchPatient.id);
    });

    it('should order patients by displayId if matched, then by first then last name, then by last then first name', async () => {
      // intentionally created out of order
      const monPartialDisplayIdPatient = await models.Patient.create(
        await createDummyPatient(models, {
          firstName: 'Test',
          lastName: 'Patient',
          displayId: 'mon123',
        }),
      );
      const monLastNamePatient = await models.Patient.create(
        await createDummyPatient(models, {
          firstName: 'Test',
          lastName: 'Montegue',
          displayId: 'lastname',
        }),
      );
      const monFirstNameFirstPatient = await models.Patient.create(
        await createDummyPatient(models, {
          firstName: 'Monica',
          lastName: 'Patient',
          displayId: 'firstfirstname',
        }),
      );
      const monFirstNameSecondPatient = await models.Patient.create(
        await createDummyPatient(models, {
          firstName: 'Monty', // testing alphabetical order within a section
          lastName: 'Patient',
          displayId: 'secondfirstname',
        }),
      );
      const monExactDisplayIdPatient = await models.Patient.create(
        await createDummyPatient(models, {
          firstName: 'Test',
          lastName: 'Patient',
          displayId: 'mon',
        }),
      );

      const result = await userApp.get('/api/suggestions/patient').query({ q: 'mon' });
      expect(result).toHaveSucceeded();

      const orderedPatientIds = [
        monExactDisplayIdPatient.id,
        monPartialDisplayIdPatient.id,
        monFirstNameFirstPatient.id,
        monFirstNameSecondPatient.id,
        monLastNamePatient.id,
      ];
      const { body } = result;
      expect(body.map((p) => p.id)).toStrictEqual(orderedPatientIds);
    });

    it('should not get patients without permission', async () => {
      const result = await baseApp.get('/api/suggestions/patient').query({ q: 'anything' });
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
      const result = await userApp.get('/api/suggestions/location');
      expect(result).toHaveSucceeded();

      const { body } = result;

      const occupiedResult = body.find((x) => x.id === occupiedLocation.id);
      expect(occupiedResult).toHaveProperty('availability', LOCATION_AVAILABILITY_STATUS.OCCUPIED);

      const reservedResult = body.find((x) => x.id === reservedLocation.id);
      expect(reservedResult).toHaveProperty('availability', LOCATION_AVAILABILITY_STATUS.RESERVED);

      const unrestrictedResult = body.find((x) => x.id === unrestrictedLocation.id);
      expect(unrestrictedResult).toHaveProperty(
        'availability',
        LOCATION_AVAILABILITY_STATUS.AVAILABLE,
      );

      const otherResults = body.filter(
        (x) => ![occupiedLocation.id, reservedLocation.id, unrestrictedLocation.id].includes(x.id),
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
      const result = await userApp.get('/api/suggestions/location');
      expect(result).toHaveSucceeded();
      expect(result?.body?.length).toEqual(3);

      const filteredResult = await userApp.get(
        '/api/suggestions/location?locationGroupId=test-area',
      );
      expect(filteredResult).toHaveSucceeded();
      expect(filteredResult?.body?.length).toEqual(2);
    });

    it('should sort locations naturally', async () => {
      await models.Location.truncate({ cascade: true });

      await findOneOrCreate(models, models.Location, {
        name: 'Bed 1',
        visibilityStatus: 'current',
      });
      await findOneOrCreate(models, models.Location, {
        name: 'Bed 9',
        visibilityStatus: 'current',
      });
      await findOneOrCreate(models, models.Location, {
        name: 'Bed 15',
        visibilityStatus: 'current',
      });
      const result = await userApp.get('/api/suggestions/location');
      expect(result).toHaveSucceeded();
      expect(result?.body?.length).toEqual(3);
      expect(result?.body?.map(({ name }) => name)).toEqual(['Bed 1', 'Bed 9', 'Bed 15']);
    });

    it('should return facilityId with suggestion list', async () => {
      await models.Location.truncate({ cascade: true, force: true });
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
      const result = await userApp.get('/api/suggestions/location');
      expect(result).toHaveSucceeded();
      expect(result?.body?.length).toEqual(1);
      expect(result.body[0].facilityId).toEqual(facility.id);
    });
  });

  // Labs has functionality for only returning categories that have results for a particular patient
  describe('patientLabTestCategories', () => {
    let patientId;
    let encounterId;

    beforeAll(async () => {
      await models.ReferenceData.destroy({ where: { type: 'labTestCategory' } });
      await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        name: 'AA-decoy1',
        type: 'labTestCategory',
      });
      await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        name: 'BB-decoy2',
        type: 'labTestCategory',
      });
      const { id: unpublishedCategoryId } = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        name: 'AA-unpublished',
        type: 'labTestCategory',
      });
      const { id: usedCategoryId } = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        name: 'AA-used',
        type: 'labTestCategory',
      });
      patientId = (await models.Patient.create(await createDummyPatient(models))).id;

      const encounter = await models.Encounter.create(
        await createDummyEncounter(models, { patientId }),
      );
      encounterId = encounter.id;

      await models.LabRequest.createWithTests(
        await randomLabRequest(models, {
          categoryId: unpublishedCategoryId,
          status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
          encounterId,
        }),
      );
      await models.LabRequest.createWithTests(
        await randomLabRequest(models, {
          categoryId: usedCategoryId,
          status: LAB_REQUEST_STATUSES.PUBLISHED,
          encounterId,
        }),
      );
    });

    it('should not filter if there is no patient id', async () => {
      const result = await userApp
        .get('/v1/suggestions/patientLabTestCategories')
        .query({ q: 'AA' });
      expect(result).toHaveSucceeded();
      expect(result?.body?.length).toEqual(3);
    });

    it('should filter lab test categories by use', async () => {
      const result = await userApp.get('/v1/suggestions/patientLabTestCategories').query({
        patientId,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
      });
      expect(result).toHaveSucceeded();
      expect(result?.body?.length).toEqual(1);
      expect(result.body[0].name).toEqual('AA-used');
    });

    it('should escape the query params', async () => {
      const result = await userApp.get('/v1/suggestions/patientLabTestCategories').query({
        q: `bobby tables'; drop all '' $$ \\';`,
        patientId: `bobby tables'; drop all '' $$ \\';`,
      });
      expect(result).toHaveSucceeded();
      expect(result?.body?.length).toEqual(0);
    });

    it('should filter lab test categories if lab test types are sensitive', async () => {
      const labRequestData = await randomSensitiveLabRequest(models, {
        patientId,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
        encounterId,
      });
      await models.LabRequest.createWithTests(labRequestData);

      const result = await userApp.get('/v1/suggestions/patientLabTestCategories').query({
        patientId,
      });
      expect(result).toHaveSucceeded();
      expect(result.body.length).toEqual(1);
      expect(result.body[0].name).toEqual('AA-used');
    });
  });

  describe('General functionality (via diagnoses)', () => {
    const limit = 25;

    it('should get a default list of suggestions with an empty query', async () => {
      const result = await userApp.get('/api/suggestions/diagnosis');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(limit);
    });

    it('should get a full list of diagnoses with a general query', async () => {
      const result = await userApp.get('/api/suggestions/diagnosis?q=A');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(limit);
    });

    it('should get a partial list of diagnoses with a specific query', async () => {
      const count = testDiagnoses.filter((td) =>
        td.name.toLowerCase().includes('bacterial'),
      ).length;
      expect(count).toBeLessThan(limit); // ensure we're actually testing filtering!
      const result = await userApp.get('/api/suggestions/diagnosis?q=bacterial');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(count);
    });

    it('should not be case sensitive', async () => {
      const result = await userApp.get('/api/suggestions/diagnosis?q=pNeUmOnIa');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBeGreaterThan(0);
    });

    it('should look up a specific suggestion', async () => {
      const record = await models.ReferenceData.findOne();
      const result = await userApp.get(`/api/suggestions/diagnosis/${record.id}`, {
        language: 'en',
      });
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toHaveProperty('name', record.name);
      expect(body).toHaveProperty('id', record.id);
    });
  });

  describe('Other suggesters', () => {
    it('should get suggestions for a medication', async () => {
      const result = await userApp.get('/api/suggestions/drug?q=a');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBeGreaterThan(0);
    });

    it('should get suggestions for a survey', async () => {
      const programId1 = 'all-survey-program-id';
      const programId2 = 'alternative-program-id';
      const obsoleteSurveyId = 'obsolete-survey-id';
      await models.Program.create({
        id: programId1,
        name: 'Program',
      });
      await models.Program.create({
        id: programId2,
        name: 'Program',
      });

      await models.Survey.bulkCreate([
        {
          id: obsoleteSurveyId,
          programId: programId1,
          name: 'XX - Obsolete Survey',
          surveyType: SURVEY_TYPES.OBSOLETE,
        },
        {
          id: 'referral-survey-id',
          programId: programId1,
          name: 'XX - Referral Survey',
        },
        {
          id: 'program-survey-id',
          programId: programId1,
          name: 'XX - Program Survey',
        },
        {
          id: 'program-survey-id-2',
          programId: programId1,
          name: 'ZZ - Program Survey',
        },
        {
          id: 'program2-survey-id-2',
          programId: programId2,
          name: 'AA - Program Survey',
        },
      ]);

      const result = await userApp
        .get('/api/suggestions/survey')
        .query({ q: 'X', programId: 'all-survey-program-id' });
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
      return models.ReferenceData.truncate({ cascade: true, force: true });
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

      const result = await userApp.get('/api/suggestions/diagnosis?q=cons');
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

      const result = await userApp.get('/api/suggestions/diagnosis?q=acute');
      expect(result).toHaveSucceeded();
      const { body } = result;

      const sortedTestData = testData.sort((a, b) => a.name.localeCompare(b.name));
      expect(body.map(({ name }) => name)).toEqual(sortedTestData.map(({ name }) => name));
    });
  });

  it('should return translated labels for current language if present in the db', async () => {
    const { TranslatedString, ReferenceData } = models;

    const DATA_TYPE = 'diagnosis';
    const DATA_ID = 'test-diagnosis';
    const ORIGINAL_LABEL = 'AAAOriginal label'; // A's are to ensure it comes first in the list
    const ENGLISH_LABEL = 'AAAEnglish label';
    const KHMER_LABEL = 'AAAKhmer label';
    const ENGLISH_CODE = 'en';
    const KHMER_CODE = 'km';

    await ReferenceData.create({
      id: DATA_ID,
      type: DATA_TYPE,
      name: ORIGINAL_LABEL,
      code: 'test-diagnosis',
    });

    await TranslatedString.create({
      stringId: `${REFERENCE_DATA_TRANSLATION_PREFIX}.${DATA_TYPE}.${DATA_ID}`,
      text: ENGLISH_LABEL,
      language: ENGLISH_CODE,
    });

    await TranslatedString.create({
      stringId: `${REFERENCE_DATA_TRANSLATION_PREFIX}.${DATA_TYPE}.${DATA_ID}`,
      text: KHMER_LABEL,
      language: KHMER_CODE,
    });

    const englishResults = await userApp.get(`/api/suggestions/${DATA_TYPE}?language=en`);
    const khmerResults = await userApp.get(`/api/suggestions/${DATA_TYPE}?language=km`);

    const englishRecord = englishResults.body.find(({ id }) => id === DATA_ID);
    expect(englishRecord.name).toEqual(ENGLISH_LABEL);

    const khmerRecord = khmerResults.body.find(({ id }) => id === DATA_ID);
    expect(khmerRecord.name).toEqual(KHMER_LABEL);
  });

  it('should only search against translated names if they exist', async () => {
    const { TranslatedString, ReferenceData } = models;

    await ReferenceData.create({
      id: 'test-drug',
      type: 'drug',
      name: 'banana',
      code: 'test-drug',
    });

    await TranslatedString.create({
      stringId: `${REFERENCE_DATA_TRANSLATION_PREFIX}.drug.test-drug`,
      text: 'apple',
      language: 'en',
    });

    // Check that the translated label can be matched through search
    const result1 = await userApp.get(`/api/suggestions/drug?language=en&q=apple`);
    expect(result1.body.length).toEqual(1);
    expect(result1.body[0].name).toEqual('apple');

    // Check that the original label is not matched since a translated label exists
    const result2 = await userApp.get(`/api/suggestions/drug?language=en&q=banana`);
    expect(result2.body.length).toEqual(0);

    // Drop the translation and check that the original label is matched
    await TranslatedString.truncate({ cascade: true, force: true });
    const result3 = await userApp.get(`/api/suggestions/drug?language=en&q=banana`);
    expect(result3.body.length).toEqual(1);
    expect(result3.body[0].name).toEqual('banana');
  });

  it.skip('should return translated labels for the correct facility', async () => {
    const { TranslatedString } = models;

    const facility1 = await findOneOrCreate(models, models.Facility, {
      id: 'facility-1',
    });

    const facility2 = await findOneOrCreate(models, models.Facility, {
      id: 'facility-2',
    });
    await findOneOrCreate(models, models.LocationGroup, {
      id: 'f1-test-area',
      name: 'F1 Test Area',
      facilityId: facility1.id,
    });

    await findOneOrCreate(models, models.LocationGroup, {
      id: 'f2-test-area',
      name: 'F2 Test Area',
      facilityId: facility2.id,
    });

    const DATA_TYPE = 'locationGroup';
    const ENGLISH_CODE = 'en';
    const KHMER_CODE = 'km';

    await TranslatedString.create({
      stringId: `${REFERENCE_DATA_TRANSLATION_PREFIX}.${DATA_TYPE}.f1-test-area`,
      text: 'Facility 1 Test Area',
      language: ENGLISH_CODE,
    });

    await TranslatedString.create({
      stringId: `${REFERENCE_DATA_TRANSLATION_PREFIX}.${DATA_TYPE}.f2-test-area`,
      text: 'Facility 1 Test Area',
      language: KHMER_CODE,
    });

    const englishResults = await userApp.get(`/api/suggestions/facilityLocationGroup?language=en`);
    const khmerResults = await userApp.get(`/api/suggestions/facilityLocationGroup?language=km`);
    expect(englishResults.body.length).toEqual(1);
    expect(khmerResults.body.length).toEqual(1);
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

    const result = await userApp.get('/api/suggestions/allergy?q=visibility');
    expect(result).toHaveSucceeded();
    const { body } = result;

    const idArray = body.map(({ id }) => id);
    expect(idArray).toContain(visible.id);
    expect(idArray).not.toContain(invisible.id);
  });

  it('Should get all suggestions on the /all endpoint', async () => {
    await models.ReferenceData.truncate({ cascade: true, force: true });
    const dummyRecords = new Array(30).fill(0).map((_, i) => ({
      id: `diag-${i}`,
      type: 'diagnosis',
      name: `Diag ${i}`,
      code: `diag-${i}`,
    }));

    await models.ReferenceData.bulkCreate(dummyRecords);
    const result = await userApp.get('/api/suggestions/diagnosis/all');
    expect(result).toHaveSucceeded();
    expect(result.body).toHaveLength(30);
  });
});
