import {
  createDummyPatient,
  createDummyEncounter,
  randomReferenceId,
} from 'shared/demoData/patients';
import { startOfDay, subDays, subYears } from 'date-fns';
import { toDateString } from 'shared/utils/dateTime';
import { createTestContext } from '../utilities';

// helper function to check we've found the intended samples
// (we're using first name as the field that indicates which
// test it should/shouldn't be found in)
const withFirstName = name => ({ firstName }) => firstName === name;

// function to pick a random time x years ago today
const yearsAgo = (years, days = 0) =>
  toDateString(subDays(subYears(startOfDay(new Date()), years), days));

// add a bunch of patients at the top rather than per-search, so that the
// tests have a healthy population of negative examples as well
const searchTestPatients = [
  { displayId: 'search-by-display-id' },
  { displayId: 'search-by-secondary-id', secondaryIds: ['patient-secondary-id'] },
  { displayId: 'multiple-secondary-id', secondaryIds: ['multi-secondary-1', 'multi-secondary-2', 'multi-secondary-3'] },
  { displayId: 'matching-2ndary-id', secondaryIds: ['matching-2ndary-id'] },
  { firstName: 'search-by-name' },
  { firstName: 'search-by-name' },
  { firstName: 'search-by-name' },
  { firstName: 'search-by-age-OLD', dateOfBirth: yearsAgo(50) },
  { firstName: 'search-by-age-OLD', dateOfBirth: yearsAgo(35) },
  { firstName: 'search-by-age-OLD', lastName: 'turned-31-yesterday', dateOfBirth: yearsAgo(31, 1) },
  { firstName: 'search-by-age-OLD', lastName: 'turned-31-today', dateOfBirth: yearsAgo(31) },
  { firstName: 'search-by-age-IN', lastName: 'turning-31-tomorrow', dateOfBirth: yearsAgo(31, -1) },
  { firstName: 'search-by-age-IN', lastName: 'turned-30-yesterday', dateOfBirth: yearsAgo(30, 1) },
  { firstName: 'search-by-age-IN', lastName: 'turned-30-today', dateOfBirth: yearsAgo(30) },
  { firstName: 'search-by-age-IN', lastName: 'turning-30-tomorrow', dateOfBirth: yearsAgo(30, -1) },
  { firstName: 'search-by-age-IN', lastName: 'comfortably-in-range', dateOfBirth: yearsAgo(25) },
  { firstName: 'search-by-age-IN', lastName: 'turned-20-yesterday', dateOfBirth: yearsAgo(20, 1) },
  { firstName: 'search-by-age-IN', lastName: 'turned-20-today', dateOfBirth: yearsAgo(20) },
  { firstName: 'search-by-age-YOUNG', lastName: 'turning-20-tmrw', dateOfBirth: yearsAgo(20, -1) },
  { firstName: 'search-by-age-YOUNG', dateOfBirth: yearsAgo(15) },
  { firstName: 'search-by-age-YOUNG', dateOfBirth: yearsAgo(1) },
  { firstName: 'search-by-village', villageIndex: 0 },
  { firstName: 'search-outpatient', encounters: [{ encounterType: 'clinic', current: true }] },
  { firstName: 'search-outpatient', encounters: [{ encounterType: 'clinic', current: true }] },
  { firstName: 'search-outpatient', encounters: [{ encounterType: 'clinic', current: true }] },
  { firstName: 'search-inpatient', encounters: [{ encounterType: 'admission', current: true }] },
  { firstName: 'search-inpatient', encounters: [{ encounterType: 'admission', current: true }] },
  { firstName: 'search-encounter-OUT', encounters: [{ encounterType: 'clinic' }] },
  { firstName: 'search-encounter-OUT', encounters: [{ encounterType: 'emergency' }] },
  { firstName: 'search-encounter-OUT', encounters: [{ encounterType: 'admission' }] },
  { firstName: 'search-by-location', encounters: [{ locationIndex: 0 }] },
  { firstName: 'search-by-department', encounters: [{ departmentIndex: 0 }] },
  { firstName: 'pagination', lastName: 'A' },
  { firstName: 'pagination', lastName: 'B' },
  { firstName: 'pagination', lastName: 'C' },
  { firstName: 'pagination', lastName: 'D' },
  { firstName: 'pagination', lastName: 'E' },
  { firstName: 'pagination', lastName: 'F' },
  { firstName: 'pagination', lastName: 'G' },
  { firstName: 'pagination', lastName: 'H' },
  { firstName: 'pagination', lastName: 'I' },
  { firstName: 'locale-test', lastName: 'Böhm' },
  { firstName: 'locale-test', lastName: 'Brunet' },
  {
    firstName: 'more-than-one-open-encounter',
    encounters: [
      {
        id: 'should-be-ignored-1',
        encounterType: 'clinic',
        current: false,
        startDate: '2015-01-01 08:00:00',
      },
      {
        id: 'should-be-chosen',
        encounterType: 'admission',
        current: true,
        startDate: '2014-01-01 08:00:00',
      },
      {
        id: 'should-be-ignored-2',
        encounterType: 'clinic',
        current: true,
        startDate: '2013-01-01 08:00:00',
      },
    ],
  },
];

const ageInCount = searchTestPatients.filter(withFirstName('search-by-age-IN')).length;
const ageYoungCount = searchTestPatients.filter(withFirstName('search-by-age-YOUNG')).length;
const ageOldCount = searchTestPatients.filter(withFirstName('search-by-age-OLD')).length;

describe('Patient search', () => {
  let app = null;
  let villages = null;
  let locations = null;
  let departments = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;

    app = await baseApp.asRole('practitioner');

    villages = await models.ReferenceData.findAll({ where: { type: 'village' } });
    locations = await models.Location.findAll();
    departments = await models.Department.findAll();

    await Promise.all(
      searchTestPatients.map(async ({ encounters: encountersData, secondaryIds, ...data }, i) => {
        const patientData = await createDummyPatient(models, {
          ...data,
          villageId: villages[data.villageIndex || i % villages.length].id, // even distribution of villages
        });
        const patient = await models.Patient.create(patientData);
        if (encountersData) {
          for (const encounterData of encountersData) {
            await models.Encounter.create(
              await createDummyEncounter(models, {
                ...encounterData,
                patientId: patient.id,
                departmentId:
                  departments[encounterData.departmentIndex || i % departments.length].id,
                locationId: locations[encounterData.locationIndex || i % locations.length].id,
              }),
            );
          }
        }
        if (secondaryIds) {
          await Promise.all(secondaryIds.map(async secondaryId => {
            const secondaryIdType = await randomReferenceId(models, 'secondaryIdType');
            await models.PatientSecondaryId.create({
              value: secondaryId,
              visibilityStatus: 'historical',
              typeId: secondaryIdType,
              patientId: patient.id,
            });
          }));
        }
      }),
    );
  });
  afterAll(() => ctx.close());

  it('should error if user has insufficient permissions', async () => {
    const response = await baseApp.get('/v1/patient').query({
      displayId: 'really-shouldnt-show-up',
    });
    expect(response).toBeForbidden();
  });

  it('should not error if there are no results', async () => {
    const response = await app.get('/v1/patient').query({
      displayId: 'really-shouldnt-show-up',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.data).toHaveLength(0);
    expect(response.body.count).toEqual(0);
  });

  it('should get a patient by displayId', async () => {
    const response = await app.get('/v1/patient').query({
      displayId: 'search-by-display-id',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.count).toEqual(1);

    const [responsePatient] = response.body.data;
    expect(responsePatient).toHaveProperty('displayId', 'search-by-display-id');
  });

  describe('Searching by secondary IDs', () => {

    it('should NOT get a patient by secondary ID by default', async () => {
      const response = await app.get('/v1/patient').query({
        displayId: 'patient-secondary-id',
      });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(0);
    });

    it('should get a patient by secondary ID if query param matchSecondaryIds is true', async () => {
      const response = await app.get('/v1/patient').query({
        displayId: 'patient-secondary-id',
        matchSecondaryIds: true,
      });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);

      const [responsePatient] = response.body.data;
      expect(responsePatient).toHaveProperty('displayId', 'search-by-secondary-id');
    });

    it('should get a patient by secondary ID case-insensitively', async () => {
      const response = await app.get('/v1/patient').query({
        displayId: 'Patient-Secondary-Id',
        matchSecondaryIds: true,
      });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);

      const [responsePatient] = response.body.data;
      expect(responsePatient).toHaveProperty('displayId', 'search-by-secondary-id');
    });

    it("should not get a patient by secondaryId if it's only a partial match", async () => {
      const response = await app.get('/v1/patient').query({
        displayId: 'patient-seco',
        matchSecondaryIds: true,
      });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(0);
    });

    it('should get a patient by displayId even if query param matchSecondaryIds is true', async () => {
      const response = await app.get('/v1/patient').query({
        displayId: 'search-by-display-id',
        matchSecondaryIds: true,
      });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);

      const [responsePatient] = response.body.data;
      expect(responsePatient).toHaveProperty('displayId', 'search-by-display-id');
    });

    it('should not see duplicates when patient primary displayId matches a secondary ID', async () => {
      const response = await app.get('/v1/patient').query({
        displayId: 'matching-2ndary-id',
      });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
    });

    it('should not see duplicates when patients have multiple secondary IDs', async () => {
      const response = await app.get('/v1/patient').query({
        displayId: 'multiple-secondary-id',
      });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
    });

  });

  it('should get a list of patients by first name', async () => {
    const response = await app.get('/v1/patient').query({
      firstName: 'search-by-name',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.count).toEqual(3);

    response.body.data.forEach(responsePatient => {
      expect(responsePatient).toHaveProperty('firstName', 'search-by-name');
    });
  });

  it('should get a list of patients by first name (partial match, case insensitive)', async () => {
    const response = await app.get('/v1/patient').query({
      firstName: 'SeArCh-bY-Na',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.count).toEqual(3);

    response.body.data.forEach(responsePatient => {
      expect(responsePatient).toHaveProperty('firstName', 'search-by-name');
    });
  });

  describe('Age filtering', () => {
    it('should get a list of patients by maximum age', async () => {
      const response = await app.get('/v1/patient').query({
        ageMax: 30,
        rowsPerPage: searchTestPatients.length,
      });
      expect(response).toHaveSucceeded();

      const { data } = response.body;
      const resultsIn = data.filter(withFirstName('search-by-age-IN'));
      const resultsOld = data.filter(withFirstName('search-by-age-OLD'));
      const resultsYoung = data.filter(withFirstName('search-by-age-YOUNG'));

      expect(resultsIn).toHaveLength(ageInCount);
      expect(resultsYoung).toHaveLength(ageYoungCount);
      expect(resultsOld).toHaveLength(0);
    });

    it('should get a list of patients by minimum age', async () => {
      const response = await app.get('/v1/patient').query({
        ageMin: 20,
        rowsPerPage: searchTestPatients.length,
      });
      expect(response).toHaveSucceeded();

      const { data } = response.body;
      const resultsIn = data.filter(withFirstName('search-by-age-IN'));
      const resultsOld = data.filter(withFirstName('search-by-age-OLD'));
      const resultsYoung = data.filter(withFirstName('search-by-age-YOUNG'));

      expect(resultsIn).toHaveLength(ageInCount);
      expect(resultsOld).toHaveLength(ageOldCount);
      expect(resultsYoung).toHaveLength(0);
    });

    it('should get a list of patients by age range', async () => {
      const response = await app.get('/v1/patient').query({
        ageMax: 30,
        ageMin: 20,
        rowsPerPage: searchTestPatients.length,
      });
      expect(response).toHaveSucceeded();

      const { data } = response.body;
      const resultsIn = data.filter(withFirstName('search-by-age-IN'));
      const resultsOld = data.filter(withFirstName('search-by-age-OLD'));
      const resultsYoung = data.filter(withFirstName('search-by-age-YOUNG'));

      expect(resultsIn).toHaveLength(ageInCount);
      expect(resultsOld).toHaveLength(0);
      expect(resultsYoung).toHaveLength(0);
    });
  });

  it('should get a list of patients by village', async () => {
    const { id: villageId, name: villageName } = villages[0];
    const response = await app.get('/v1/patient').query({
      villageId,
    });
    expect(response).toHaveSucceeded();

    const { data } = response.body;
    expect(data.length).toBeGreaterThan(0);
    data.forEach(responsePatient => {
      expect(responsePatient).toHaveProperty('villageId', villageId);
      expect(responsePatient).toHaveProperty('villageName', villageName);
    });

    expect(data.some(withFirstName('search-by-village')));
  });

  describe('Joining encounter info', () => {
    it('should get a list of outpatients', async () => {
      const response = await app.get('/v1/patient').query({
        outpatient: true,
      });
      expect(response).toHaveSucceeded();

      // ensure all of the test entries are present
      const testOutpatients = response.body.data.filter(x => x.firstName === 'search-outpatient');
      expect(testOutpatients.length).toEqual(3);

      // ensure all of the response objects match the filter
      response.body.data.forEach(responsePatient => {
        expect(responsePatient).toHaveProperty('encounterType', 'clinic');
      });
    });

    it('should get a list of inpatients', async () => {
      const response = await app.get('/v1/patient').query({
        inpatient: true,
      });
      expect(response).toHaveSucceeded();

      // ensure all of the test entries are present
      const testInpatients = response.body.data.filter(x => x.firstName === 'search-inpatient');
      expect(testInpatients.length).toEqual(2);

      // ensure all of the response objects match the filter
      response.body.data.forEach(responsePatient => {
        expect(responsePatient).toHaveProperty('encounterType', 'admission');
      });
    });

    it('should get a list of patients by location', async () => {
      const response = await app.get('/v1/patient').query({
        locationId: locations[0].id,
      });
      expect(response).toHaveSucceeded();

      expect(response.body.data.some(withFirstName('search-by-location')));
      response.body.data.forEach(responsePatient => {
        expect(responsePatient).toHaveProperty('locationName', locations[0].name);
      });
    });

    it('should get a list of patients by department', async () => {
      const response = await app.get('/v1/patient').query({
        departmentId: departments[0].id,
      });
      expect(response).toHaveSucceeded();

      expect(response.body.data.some(withFirstName('search-by-department')));
      response.body.data.forEach(responsePatient => {
        expect(responsePatient).toHaveProperty('departmentName', departments[0].name);
      });
    });

    it('should return only 1 result for patients with multiple open encounters', async () => {
      const response = await app.get('/v1/patient').query({
        firstName: 'more-than-one-open-encounter',
      });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);

      // Make sure it chooses the correct encounter
      expect(response.body.data[0].encounterId).toEqual('should-be-chosen');
      expect(response.body.data[0].encounterType).toEqual('admission');
    });
  });

  describe('Sorting', () => {
    // TODO: use locale sort (e.g. unicode collation algorithm or similar) in the database
    // https://linear.app/bes/issue/TAN-755/tamanu-should-localise-sort-order-for-names
    // const compareStrings = (a, b) => (reverse ? -1 : 1) * a.toUpperCase().localeCompare(b.toUpperCase());
    const compareStrings = (a, b) => {
      // nulls last, case-insensitive, compared by codepoint not locale
      if (!a && b) return 1;
      if (a && !b) return -1;
      if (!a && !b) return 0;

      const aUpper = a.toUpperCase();
      const bUpper = b.toUpperCase();
      if (aUpper > bUpper) return 1;
      if (aUpper < bUpper) return -1;
      return 0;
    };
    const expectSorted = (array, mapper, reverse = false, cmp = compareStrings) => {
      const base = array.map(mapper);
      const sorted = array.map(mapper).sort((a, b) => {
        return (reverse ? -1 : 1) * cmp(a, b);
      });
      expect(sorted).toEqual(base);
    };

    it('sorts unicode in the expected order', () => {
      expect('Böhm' > 'Brunet').toBe(true);
      expect('Brunet' > 'Böhm').toBe(false);
      expect('Böhm' < 'Brunet').toBe(false);
      expect('Brunet' < 'Böhm').toBe(true);
    });

    it('should sort by surname by default', async () => {
      const response = await app.get('/v1/patient');

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.lastName);
    });

    it('should sort in descending order', async () => {
      const response = await app.get('/v1/patient', {
        order: 'desc',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data.reverse(), x => x.lastName, true);
    });

    it('should sort by date of birth', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'dateOfBirth',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.dateOfBirth);
    });

    it('should sort by date of birth in descending order', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'dateOfBirth',
        order: 'desc',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.dateOfBirth, true);
    });

    it('should sort by age', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'age',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.dateOfBirth);
    });

    it('should sort by age in descending order', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'age',
        order: 'desc',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.dateOfBirth, true);
    });

    it('should sort by encounter type', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'encounterType',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.encounterType);
    });

    it('should sort by encounter type in descending order', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'encounterType',
        order: 'desc',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.encounterType, true);
    });

    it('should sort by location', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'locationName',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.locationName);
    });

    it('should sort by department', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'departmentName',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.departmentName);
    });

    it('should sort by village', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'villageName',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.villageName);
    });
  });

  describe('Pagination', () => {
    it('should retrieve first page of patients', async () => {
      const response = await app.get('/v1/patient').query({
        firstName: 'pagination',
        orderBy: 'lastName',
        rowsPerPage: 3,
      });

      expect(response).toHaveSucceeded();

      const { data, count } = response.body;
      expect(data.length).toEqual(3);
      expect(count).toEqual(9);

      expect(data[0].lastName).toEqual('A');
    });

    it('should retrieve second page of patients', async () => {
      const response = await app.get('/v1/patient').query({
        firstName: 'pagination',
        orderBy: 'lastName',
        rowsPerPage: 3,
        page: 1,
      });

      expect(response).toHaveSucceeded();

      const { data, count } = response.body;
      expect(data.length).toEqual(3);
      expect(count).toEqual(9);

      expect(data[0].lastName).toEqual('D');
    });
  });
});
