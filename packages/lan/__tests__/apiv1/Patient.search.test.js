import { createDummyPatient, createDummyVisit } from 'shared/demoData/patients';
import moment from 'moment';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

// helper function to check we've found the intended samples
// (we're using first name as the field that indicates which
// test it should/shouldn't be found in)
const withFirstName = name => ({ firstName }) => firstName === name;

const yearsAgo = years =>
  moment()
    .subtract(years, 'years')
    .toDate();

// add a bunch of patients at the top rather than per-search, so that the
// tests have a healthy population of negative examples as well
const searchTestPatients = [
  { displayId: 'search-by-display-id' },
  { firstName: 'search-by-name' },
  { firstName: 'search-by-name' },
  { firstName: 'search-by-name' },
  { firstName: 'search-by-age-OLD', dateOfBirth: yearsAgo(50) },
  { firstName: 'search-by-age-OLD', dateOfBirth: yearsAgo(31) },
  { firstName: 'search-by-age-IN', dateOfBirth: yearsAgo(30) },
  { firstName: 'search-by-age-IN', dateOfBirth: yearsAgo(25) },
  { firstName: 'search-by-age-IN', dateOfBirth: yearsAgo(20) },
  { firstName: 'search-by-age-YOUNG', dateOfBirth: yearsAgo(19) },
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
    expect(response.body.results).toHaveLength(0);
    expect(response.body.total).toEqual(0);
  });

  it('should get a patient by displayId', async () => {
    const response = await app.get('/v1/patient').query({
      displayId: 'search-by-display-id',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.total).toEqual(1);

    const [responsePatient] = response.body.results;
    expect(responsePatient).toHaveProperty('displayId', 'search-by-display-id');
  });

  it('should get a list of patients by first name', async () => {
    const response = await app.get('/v1/patient').query({
      firstName: 'search-by-name',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.total).toEqual(3);

    response.body.results.map(responsePatient => {
      expect(responsePatient).toHaveProperty('firstName', 'search-by-name');
    });
  });

  it('should get a list of patients by first name (partial match, case insensitive)', async () => {
    const response = await app.get('/v1/patient').query({
      firstName: 'SeArCh-bY-Na',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.total).toEqual(3);

    response.body.results.map(responsePatient => {
      expect(responsePatient).toHaveProperty('firstName', 'search-by-name');
    });
  });

  it('should get a list of patients by maximum age', async () => {
    const response = await app.get('/v1/patient').query({
      ageMax: 30,
    });
    expect(response).toHaveSucceeded();

    const { results } = response.body;
    const resultsIn = results.filter(withFirstName('search-by-age-IN'));
    const resultsOld = results.filter(withFirstName('search-by-age-OLD'));
    const resultsYoung = results.filter(withFirstName('search-by-age-YOUNG'));

    expect(resultsIn).toHaveLength(3);
    expect(resultsYoung).toHaveLength(2);
    expect(resultsOld).toHaveLength(0);
  });

  it('should get a list of patients by minimum age', async () => {
    const response = await app.get('/v1/patient').query({
      ageMin: 20,
    });
    expect(response).toHaveSucceeded();

    const { results } = response.body;
    const resultsIn = results.filter(withFirstName('search-by-age-IN'));
    const resultsOld = results.filter(withFirstName('search-by-age-OLD'));
    const resultsYoung = results.filter(withFirstName('search-by-age-YOUNG'));

    expect(resultsIn).toHaveLength(3);
    expect(resultsOld).toHaveLength(2);
    expect(resultsYoung).toHaveLength(0);
  });

  it('should get a list of patients by age range', async () => {
    const response = await app.get('/v1/patient').query({
      ageMax: 30,
      ageMin: 20,
    });
    expect(response).toHaveSucceeded();

    const { results } = response.body;
    const resultsIn = results.filter(withFirstName('search-by-age-IN'));
    const resultsOld = results.filter(withFirstName('search-by-age-OLD'));
    const resultsYoung = results.filter(withFirstName('search-by-age-YOUNG'));

    expect(resultsIn).toHaveLength(3);
    expect(resultsOld).toHaveLength(0);
    expect(resultsYoung).toHaveLength(0);
  });

  it('should get a list of patients by village', async () => {
    const { id: villageId, name: villageName } = villages[0];
    const response = await app.get('/v1/patient').query({
      villageId,
    });
    expect(response).toHaveSucceeded();

    const { results } = response.body;
    expect(results.length).toBeGreaterThan(0);
    results.map(responsePatient => {
      expect(responsePatient).toHaveProperty('villageId', villageId);
      expect(responsePatient).toHaveProperty('village_name', villageName);
    });

    expect(results.some(withFirstName('search-by-village')));
  });

  describe('Joining visit info', () => {
    it('should get a list of patients by visit type', async () => {
      const response = await app.get('/v1/patient').query({
        visitType: 'clinic',
      });
      expect(response).toHaveSucceeded();
      expect(response.body.total).toBeGreaterThanOrEqual(3);

      response.body.results.map(responsePatient => {
        expect(responsePatient).toHaveProperty('visit_type', 'clinic');
      });
    });

    it('should get a list of patients by location', async () => {
      const response = await app.get('/v1/patient').query({
        locationId: locations[0].id,
      });
      expect(response).toHaveSucceeded();

      expect(response.body.results.some(withFirstName('search-by-location')));
      response.body.results.map(responsePatient => {
        expect(responsePatient).toHaveProperty('location_name', locations[0].name);
      });
    });

    it('should get a list of patients by department', async () => {
      const response = await app.get('/v1/patient').query({
        departmentId: departments[0].id,
      });
      expect(response).toHaveSucceeded();

      expect(response.body.results.some(withFirstName('search-by-department')));
      response.body.results.map(responsePatient => {
        expect(responsePatient).toHaveProperty('department_name', departments[0].name);
      });
    });
  });

  describe('Sorting', () => {
    test.todo('should sort by surname');
    test.todo('should sort by age');
    test.todo('should sort by visit type');
    test.todo('should sort by location');
  });
});
