import {
  LAB_REQUEST_STATUSES,
  LOCATION_AVAILABILITY_STATUS,
  SURVEY_TYPES,
  VISIBILITY_STATUSES,
  REFERENCE_DATA_TRANSLATION_PREFIX,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
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
import { fake, chance } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { testDiagnoses } from '../seed';
import { sortBy } from 'lodash';

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
      expect(body.map(p => p.id)).toStrictEqual(orderedPatientIds);
    });

    it('should not get patients without permission', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.get('/api/suggestions/patient').query({ q: 'anything' });
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
      const count = testDiagnoses.filter(td => td.name.toLowerCase().includes('bacterial')).length;
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
      return models.ReferenceData.destroy({ where: { type: 'diagnosis' }, force: true });
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

  describe('Translations', () => {
    beforeEach(async () => {
      const { TranslatedString, ReferenceData } = models;
      await ReferenceData.destroy({ where: { type: 'drug' }, force: true });
      await TranslatedString.truncate({ cascade: true, force: true });
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

      await TranslatedString.truncate({ cascade: true, force: true });

      const untranslatedResults = await userApp.get(`/api/suggestions/${DATA_TYPE}?language=en`);
      const untranslatedRecord = untranslatedResults.body.find(({ id }) => id === DATA_ID);
      expect(untranslatedRecord.name).toEqual(ORIGINAL_LABEL);
    });

    it('should return a translated label for a single record if it exists', async () => {
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

      const result = await userApp.get(`/api/suggestions/drug/test-drug?language=en`);
      expect(result).toHaveSucceeded();
      expect(result.body.name).toEqual('apple');

      await TranslatedString.truncate({ cascade: true, force: true });

      const result2 = await userApp.get(`/api/suggestions/drug/test-drug?language=en`);
      expect(result2).toHaveSucceeded();
      expect(result2.body.name).toEqual('banana');
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

    it('should order by translated name if it exists', async () => {
      const { TranslatedString, ReferenceData } = models;

      // Create 10 reference data records with random names
      const testData = Array.from({ length: 10 }, (_, i) => ({
        id: `test-drug-${i}`,
        type: 'drug',
        name: `Drug ${chance.word()}`,
        code: `test-drug-${i}`,
      }));
      await ReferenceData.bulkCreate(testData);

      const alphabeticalTestDataNames = sortBy(testData, 'name').map(({ name }) => name);

      // Check they order alphabetically
      const result = await userApp.get('/api/suggestions/drug?q=drug');
      expect(result).toHaveSucceeded();
      expect(result.body.map(({ name }) => name)).toEqual(alphabeticalTestDataNames);

      // Create 10 random translations
      const translations = Array.from({ length: 10 }, (_, i) => ({
        stringId: `${REFERENCE_DATA_TRANSLATION_PREFIX}.drug.test-drug-${i}`,
        text: `Drug ${chance.word()}`,
        language: 'en',
      }));
      await TranslatedString.bulkCreate(translations);

      const alphabeticalTranslationText = sortBy(translations, 'text').map(({ text }) => text);

      // Check they order by translated name
      const result2 = await userApp.get('/api/suggestions/drug?q=drug&language=en');
      expect(result2).toHaveSucceeded();
      expect(result2.body.map(({ name }) => name)).toEqual(alphabeticalTranslationText);
    });
  });

  describe('Address hierarchy', () => {
    it('should filter address_hierarchy fields by parent id if supplied in query', async () => {
      const { ReferenceData, ReferenceDataRelation } = models;
      const fakeReferenceData = async type =>
        await ReferenceData.create(fake(ReferenceData, { type }));

      const fakeReferenceDataRelation = async ({ parentId, childId }) =>
        await ReferenceDataRelation.create(
          fake(ReferenceDataRelation, {
            type: 'address_hierarchy',
            referenceDataId: childId,
            referenceDataParentId: parentId,
          }),
        );

      // create a linked address hierarchy division, subdivision, settlement and village
      const divisionInHierarchy = await fakeReferenceData('division');
      const subdivisionInHierarchy = await fakeReferenceData('subdivision');
      const settlementInHierarchy = await fakeReferenceData('settlement');
      const villageInHierarchy = await fakeReferenceData('village');

      // Create the links between the hierarchy
      await fakeReferenceDataRelation({
        parentId: divisionInHierarchy.id,
        childId: subdivisionInHierarchy.id,
      });
      await fakeReferenceDataRelation({
        parentId: subdivisionInHierarchy.id,
        childId: settlementInHierarchy.id,
      });
      await fakeReferenceDataRelation({
        parentId: settlementInHierarchy.id,
        childId: villageInHierarchy.id,
      });

      // Create data outside of the hierarchy
      await fakeReferenceData('subdivision');
      await fakeReferenceData('settlement');
      await fakeReferenceData('village');

      const divisionResults = await userApp.get('/api/suggestions/division');
      expect(divisionResults).toHaveSucceeded();
      expect(divisionResults.body.length).toEqual(1);
      expect(divisionResults.body[0].id).toEqual(divisionInHierarchy.id);

      const subdivisionResults = await userApp.get(
        `/api/suggestions/subdivision?parentId=${divisionInHierarchy.id}`,
      );
      expect(subdivisionResults).toHaveSucceeded();
      expect(subdivisionResults.body.length).toEqual(1);
      expect(subdivisionResults.body[0].id).toEqual(subdivisionInHierarchy.id);

      const settlementResults = await userApp.get(
        `/api/suggestions/settlement?parentId=${subdivisionInHierarchy.id}`,
      );
      expect(settlementResults).toHaveSucceeded();
      expect(settlementResults.body.length).toEqual(1);
      expect(settlementResults.body[0].id).toEqual(settlementInHierarchy.id);

      const villageResults = await userApp.get(
        `/api/suggestions/village?parentId=${settlementInHierarchy.id}`,
      );
      expect(villageResults).toHaveSucceeded();
      expect(villageResults.body.length).toEqual(1);
      expect(villageResults.body[0].id).toEqual(villageInHierarchy.id);
    });

    it('should test early limit application in address hierarchy filtering', async () => {
      // Create 30 divisions with names that ensure alphabetical ordering
      // Use zero-padded numbers to ensure proper alphabetical order
      const divisions = [];
      for (let i = 1; i <= 30; i++) {
        const paddedNumber = i.toString().padStart(2, '0');
        const division = await models.ReferenceData.create({
          id: `test-division-${paddedNumber}`,
          code: `DIV_${paddedNumber}`,
          type: 'division',
          name: `Division ${paddedNumber}`,
          visibilityStatus: 'current',
        });
        divisions.push(division);
      }

      // Create one parent to filter by
      const parentCountry = await models.ReferenceData.create({
        id: 'test-parent-country',
        code: 'PARENT_COUNTRY',
        type: 'country',
        name: 'Parent Country',
        visibilityStatus: 'current',
      });

      // Only create relations for the last 5 divisions (26-30)
      // With zero-padding, these will be alphabetically last
      for (let i = 26; i <= 30; i++) {
        const paddedNumber = i.toString().padStart(2, '0');
        await models.ReferenceDataRelation.create({
          referenceDataId: `test-division-${paddedNumber}`,
          referenceDataParentId: parentCountry.id,
          type: 'address_hierarchy',
        });
      }

      const result = await userApp.get(
        `/api/suggestions/division?q=division&parentId=${parentCountry.id}&language=en`,
      );
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      // If the limit is applied correctly (after the join), we should get 5 results
      // If limit is applied too early (before the join), we might get 0 results
      expect(body.length).toBe(5);

      // Verify we got the correct divisions (26-30)
      const returnedIds = body.map(item => item.id).sort();
      const expectedIds = [
        'test-division-26',
        'test-division-27',
        'test-division-28',
        'test-division-29',
        'test-division-30',
      ];
      expect(returnedIds).toEqual(expectedIds);
    });

    it('should sort results alphabetically when filtering by parentId', async () => {
      const parentDivision = await models.ReferenceData.create({
        id: 'sort-test-parent-division',
        code: 'SORT_PARENT_DIV',
        type: 'division',
        name: 'Sort Test Parent Division',
        visibilityStatus: 'current',
      });

      // Create subdivisions with names that would be out of order if not sorted
      const subdivisionNames = ['Zebra District', 'Alpha District', 'Mike District', 'Charlie District'];
      for (const name of subdivisionNames) {
        const subdivision = await models.ReferenceData.create({
          id: `sort-test-${name.toLowerCase().replace(' ', '-')}`,
          code: `SORT_${name.toUpperCase().replace(' ', '_')}`,
          type: 'subdivision',
          name,
          visibilityStatus: 'current',
        });

        await models.ReferenceDataRelation.create({
          referenceDataId: subdivision.id,
          referenceDataParentId: parentDivision.id,
          type: 'address_hierarchy',
        });
      }

      const result = await userApp.get(
        `/api/suggestions/subdivision?parentId=${parentDivision.id}&language=en`,
      );
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBe(4);

      // Results should be sorted alphabetically
      const returnedNames = body.map(item => item.name);
      const expectedOrder = ['Alpha District', 'Charlie District', 'Mike District', 'Zebra District'];
      expect(returnedNames).toEqual(expectedOrder);
    });

    it('should sort translated results alphabetically when filtering by parentId', async () => {
      const { TranslatedString } = models;

      const parentDivision = await models.ReferenceData.create({
        id: 'trans-sort-parent-division',
        code: 'TRANS_SORT_PARENT_DIV',
        type: 'division',
        name: 'Trans Sort Parent Division',
        visibilityStatus: 'current',
      });

      // Create subdivisions with original names, then translate them out of order
      const subdivisions = [
        { id: 'trans-sub-1', name: 'Original AAA', translation: 'Zulu Translation' },
        { id: 'trans-sub-2', name: 'Original BBB', translation: 'Alpha Translation' },
        { id: 'trans-sub-3', name: 'Original CCC', translation: 'Mike Translation' },
      ];

      for (const sub of subdivisions) {
        const subdivision = await models.ReferenceData.create({
          id: sub.id,
          code: sub.id.toUpperCase(),
          type: 'subdivision',
          name: sub.name,
          visibilityStatus: 'current',
        });

        await models.ReferenceDataRelation.create({
          referenceDataId: subdivision.id,
          referenceDataParentId: parentDivision.id,
          type: 'address_hierarchy',
        });

        await TranslatedString.create({
          stringId: `referenceData.subdivision.${sub.id}`,
          text: sub.translation,
          language: 'en',
        });
      }

      const result = await userApp.get(
        `/api/suggestions/subdivision?parentId=${parentDivision.id}&language=en`,
      );
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBe(3);

      // Results should be sorted by translated name
      const returnedNames = body.map(item => item.name);
      const expectedOrder = ['Alpha Translation', 'Mike Translation', 'Zulu Translation'];
      expect(returnedNames).toEqual(expectedOrder);
    });
  });

  describe('Medication sets', () => {
    it('should return medication sets sorted alphabetically with complex includes', async () => {
      const { ReferenceData, ReferenceDataRelation, ReferenceMedicationTemplate } = models;

      // Create medication set reference data
      const medicationSet1 = await ReferenceData.create({
        id: 'test-med-set-zebra',
        code: 'MED_SET_ZEBRA',
        type: 'medicationSet',
        name: 'Zebra Medication Set',
        visibilityStatus: 'current',
      });

      const medicationSet2 = await ReferenceData.create({
        id: 'test-med-set-alpha',
        code: 'MED_SET_ALPHA',
        type: 'medicationSet',
        name: 'Alpha Medication Set',
        visibilityStatus: 'current',
      });

      const medicationSet3 = await ReferenceData.create({
        id: 'test-med-set-mike',
        code: 'MED_SET_MIKE',
        type: 'medicationSet',
        name: 'Mike Medication Set',
        visibilityStatus: 'current',
      });

      // Create a drug for the medication templates
      const drug = await ReferenceData.create({
        id: 'test-drug-for-set',
        code: 'DRUG_FOR_SET',
        type: 'drug',
        name: 'Test Drug',
        visibilityStatus: 'current',
      });

      // Create medication templates and relations for each set
      for (const medSet of [medicationSet1, medicationSet2, medicationSet3]) {
        const templateRef = await ReferenceData.create({
          id: `template-ref-${medSet.id}`,
          code: `TEMPLATE_${medSet.code}`,
          type: 'medicationTemplate',
          name: `Template for ${medSet.name}`,
          visibilityStatus: 'current',
        });

        await ReferenceMedicationTemplate.create({
          referenceDataId: templateRef.id,
          medicationId: drug.id,
          units: 'mg',
          frequency: 'daily',
          route: 'oral',
        });

        await ReferenceDataRelation.create({
          referenceDataId: templateRef.id,
          referenceDataParentId: medSet.id,
          type: 'medication',
        });
      }

      const result = await userApp.get('/api/suggestions/medicationSet?language=en');
      expect(result).toHaveSucceeded();

      const { body } = result;
      const testSetResults = body.filter(item => item.id.startsWith('test-med-set-'));

      expect(testSetResults.length).toBe(3);

      // Results should be sorted alphabetically despite complex joins
      const returnedNames = testSetResults.map(item => item.name);
      expect(returnedNames).toEqual([
        'Alpha Medication Set',
        'Mike Medication Set',
        'Zebra Medication Set',
      ]);
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

    const result = await userApp.get('/api/suggestions/allergy?q=visibility');
    expect(result).toHaveSucceeded();
    const { body } = result;

    const idArray = body.map(({ id }) => id);
    expect(idArray).toContain(visible.id);
    expect(idArray).not.toContain(invisible.id);
  });

  it('Should get all suggestions on the /all endpoint', async () => {
    await models.ReferenceData.destroy({ where: { type: 'diagnosis' }, force: true });
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

  it('should handle complex includes in invoiceProduct suggester', async () => {
    const { id: categoryId } = await models.ReferenceData.create({
      ...fake(models.ReferenceData),
      name: 'Test Lab Test Category',
      type: 'labTestCategory',
    });
    const labTestType = await models.LabTestType.create({
      id: 'test-lab-test-type-id',
      code: 'TEST_LAB_TEST_TYPE',
      labTestCategoryId: categoryId,
    });

    const invoiceProduct = await models.InvoiceProduct.create({
      name: 'Test Invoice Product',
      category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE,
      sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE],
      sourceRecordId: labTestType.id,
      discountable: true,
      visibilityStatus: 'current',
    });

    const result = await userApp.get('/api/suggestions/invoiceProduct?q=test&language=en');
    expect(result).toHaveSucceeded();

    const { body } = result;
    expect(body).toBeInstanceOf(Array);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id', invoiceProduct.id);
  });

  it('should handle complex includes in multiReferenceData suggester', async () => {
    const parentTaskTemplate = await models.ReferenceData.create({
      id: 'test-task-template-parent',
      code: 'TASK_PARENT',
      type: 'taskTemplate',
      name: 'Parent Task Template',
      visibilityStatus: 'current',
    });

    const childTaskTemplate = await models.ReferenceData.create({
      id: 'test-task-template-child',
      code: 'TASK_CHILD',
      type: 'taskTemplate',
      name: 'Child Task Template',
      visibilityStatus: 'current',
    });

    await models.TaskTemplate.create({
      referenceDataId: parentTaskTemplate.id,
    });

    await models.TaskTemplate.create({
      referenceDataId: childTaskTemplate.id,
    });

    await models.ReferenceDataRelation.create({
      referenceDataId: childTaskTemplate.id,
      referenceDataParentId: parentTaskTemplate.id,
      type: 'task',
    });

    const result = await userApp.get(
      '/api/suggestions/multiReferenceData?q=task&types[]=taskTemplate&relationType=task&language=en',
    );
    expect(result).toHaveSucceeded();

    const { body } = result;
    expect(body).toBeInstanceOf(Array);
    expect(body.length).toBeGreaterThan(0);
  });

  it('should handle self-referencing includes in address hierarchy suggesters', async () => {
    const parentDivision = await models.ReferenceData.create({
      id: 'test-parent-division',
      code: 'PARENT_DIV',
      type: 'division',
      name: 'Parent Division',
      visibilityStatus: 'current',
    });

    const childSubdivision = await models.ReferenceData.create({
      id: 'test-child-subdivision',
      code: 'CHILD_SUB',
      type: 'subdivision',
      name: 'Child Subdivision',
      visibilityStatus: 'current',
    });

    await models.ReferenceDataRelation.create({
      referenceDataId: childSubdivision.id,
      referenceDataParentId: parentDivision.id,
      type: 'address_hierarchy',
    });

    const result = await userApp.get(
      `/api/suggestions/subdivision?q=child&parentId=${parentDivision.id}&language=en`,
    );
    expect(result).toHaveSucceeded();

    const { body } = result;
    expect(body).toBeInstanceOf(Array);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id', childSubdivision.id);
  });
});
