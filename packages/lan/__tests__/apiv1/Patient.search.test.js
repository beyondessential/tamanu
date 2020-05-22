import { createDummyPatient, createDummyVisit } from 'shared/demoData/patients';
import moment from 'moment';
import Chance from 'chance';
import { createTestContext } from '../utilities';

const chance = new Chance();

const { baseApp, models } = createTestContext();

// helper function to check we've found the intended samples
// (we're using first name as the field that indicates which
// test it should/shouldn't be found in)
const withFirstName = name => ({ firstName }) => firstName === name;

// function to pick a random time x years ago today
const yearsAgo = (years, days = 0) =>
  moment
    .utc()
    .startOf('day')
    .add(chance.integer({ min: 1, max: 23.9 * 60 }), 'minutes')
    .subtract(years, 'years')
    .subtract(days, 'days')
    .toISOString();

// add a bunch of patients at the top rather than per-search, so that the
// tests have a healthy population of negative examples as well
const searchTestPatients = [
  { displayId: 'search-by-display-id' },
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
  { firstName: 'search-by-type', visit: { visitType: 'clinic', current: true } },
  { firstName: 'search-by-type', visit: { visitType: 'clinic', current: true } },
  { firstName: 'search-by-type', visit: { visitType: 'clinic', current: true } },
  { firstName: 'search-by-type-OUT', visit: { visitType: 'clinic' } },
  { firstName: 'search-by-type-OUT', visit: { visitType: 'emergency' } },
  { firstName: 'search-by-location', visit: { locationIndex: 0 } },
  { firstName: 'search-by-department', visit: { departmentIndex: 0 } },
];

const ageInCount = searchTestPatients.filter(withFirstName('search-by-age-IN')).length;
const ageYoungCount = searchTestPatients.filter(withFirstName('search-by-age-YOUNG')).length;
const ageOldCount = searchTestPatients.filter(withFirstName('search-by-age-OLD')).length;

describe('Patient search', () => {
  let app = null;
  let villages = null;
  let locations = null;
  let departments = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');

    villages = await models.ReferenceData.findAll({ where: { type: 'village' } });
    locations = await models.ReferenceData.findAll({ where: { type: 'location' } });
    departments = await models.ReferenceData.findAll({ where: { type: 'department' } });

    await Promise.all(
      searchTestPatients.map(async ({ visit: visitData, ...data }, i) => {
        const patientData = await createDummyPatient(models, {
          ...data,
          villageId: villages[data.villageIndex || i % villages.length].id, // even distribution of villages
        });
        const patient = await models.Patient.create(patientData);
        if (visitData) {
          await models.Visit.create(
            await createDummyVisit(models, {
              ...visitData,
              patientId: patient.id,
              departmentId: departments[visitData.departmentIndex || i % departments.length].id,
              locationId: locations[visitData.locationIndex || i % locations.length].id,
            }),
          );
        }
      }),
    );
  });

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

  it('should get a list of patients by first name', async () => {
    const response = await app.get('/v1/patient').query({
      firstName: 'search-by-name',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.count).toEqual(3);

    response.body.data.map(responsePatient => {
      expect(responsePatient).toHaveProperty('firstName', 'search-by-name');
    });
  });

  it('should get a list of patients by first name (partial match, case insensitive)', async () => {
    const response = await app.get('/v1/patient').query({
      firstName: 'SeArCh-bY-Na',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.count).toEqual(3);

    response.body.data.map(responsePatient => {
      expect(responsePatient).toHaveProperty('firstName', 'search-by-name');
    });
  });

  describe('Age filtering', () => {
    it('should get a list of patients by maximum age', async () => {
      const response = await app.get('/v1/patient').query({
        ageMax: 30,
        rowsPerPage: 100,
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
        rowsPerPage: 100,
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
        rowsPerPage: 100,
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
    data.map(responsePatient => {
      expect(responsePatient).toHaveProperty('villageId', villageId);
      expect(responsePatient).toHaveProperty('village_name', villageName);
    });

    expect(data.some(withFirstName('search-by-village')));
  });

  describe('Joining visit info', () => {
    it('should get a list of patients by visit type', async () => {
      const response = await app.get('/v1/patient').query({
        visitType: 'clinic',
      });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toBeGreaterThanOrEqual(3);

      response.body.data.map(responsePatient => {
        expect(responsePatient).toHaveProperty('visit_type', 'clinic');
      });
    });

    it('should get a list of patients by location', async () => {
      const response = await app.get('/v1/patient').query({
        locationId: locations[0].id,
      });
      expect(response).toHaveSucceeded();

      expect(response.body.data.some(withFirstName('search-by-location')));
      response.body.data.map(responsePatient => {
        expect(responsePatient).toHaveProperty('location_name', locations[0].name);
      });
    });

    it('should get a list of patients by department', async () => {
      const response = await app.get('/v1/patient').query({
        departmentId: departments[0].id,
      });
      expect(response).toHaveSucceeded();

      expect(response.body.data.some(withFirstName('search-by-department')));
      response.body.data.map(responsePatient => {
        expect(responsePatient).toHaveProperty('department_name', departments[0].name);
      });
    });
  });

  describe('Sorting', () => {
    const expectSorted = (array, mapper) => {
      const base = array.map(mapper);
      const sorted = array.map(mapper).sort((a, b) => {
        if (!a && b) return 1;
        if (a && !b) return -1;
        if (!a && !b) return 0;
        return a.toUpperCase().localeCompare(b.toUpperCase());
      });
      expect(base).toEqual(sorted);
    };

    it('should sort by surname by default', async () => {
      const response = await app.get('/v1/patient');

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.lastName);
    });

    it('should sort by age', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'age',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.dateOfBirth);
    });

    it('should sort by visit type', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'status',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.visit_type);
    });

    it('should sort by location', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'location',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.location_name);
    });

    it('should sort by department', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'department',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.department_name);
    });

    it('should sort by village', async () => {
      const response = await app.get('/v1/patient').query({
        orderBy: 'village_name',
      });

      expect(response).toHaveSucceeded();

      expectSorted(response.body.data, x => x.village_name);
    });
  });

  describe('Pagination', () => {
    test.todo('should retrieve first page of patients');
    test.todo('should retrieve second page of patients');

    test.todo('should retrieve first page of filtered patients');
    test.todo('should retrieve second page of filtered patients');

    test.todo('should retrieve first page of sorted patients');
    test.todo('should retrieve second page of sorted patients');

    test.todo('should retrieve first page of fitered & sorted patients');
    test.todo('should retrieve second page of filtered & sorted patients');
  });
});
