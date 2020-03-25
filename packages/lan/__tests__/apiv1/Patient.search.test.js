import { createDummyPatient } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

const searchTestPatients = [
  { displayId: 'search-by-display-id' },
  { firstName: 'search-by-name' },
  { firstName: 'search-by-name' },
  { firstName: 'search-by-name' },
];

describe('Patient search', () => {
  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');

    await Promise.all(searchTestPatients.map(async (data) => {
      const patient = await createDummyPatient(models, data);
      return models.Patient.create(patient);
    }));
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

    expect(response).toHaveSucceeded();
    expect(response.body.total).toEqual(3);

    response.body.results.map(responsePatient => {
      expect(responsePatient).toHaveProperty('firstName', 'search-by-name');
    });
  });

  it('should get a list of patients by age range', async () => {
    const response = await app.get('/v1/patient').query({
      ageMax: 15,
      ageMin: 10,
    });
    expect(response).toHaveSucceeded();

    expect(response).toHaveSucceeded();
    expect(response.body.total).toEqual(3);

    response.body.results.map(responsePatient => {
      expect(responsePatient).toHaveProperty('firstName', 'search-by-name');
    });
  });

  it('should get a list of patients by village', async () => {
    const response = await app.get('/v1/patient').query({
      villageName: 'test-village',
    });
    expect(response).toHaveSucceeded();

    expect(response).toHaveSucceeded();
    expect(response.body.total).toEqual(1);

    response.body.results.map(responsePatient => {
      expect(responsePatient).toHaveProperty('village_name', 'search-by-name');
    });
  });

  it('should get a list of patients by visit type', async () => {
    const response = await app.get('/v1/patient').query({
      visitType: 'clinic',
    });
    expect(response).toHaveSucceeded();

    expect(response).toHaveSucceeded();
    expect(response.body.total).toEqual(1);

    response.body.results.map(responsePatient => {
      expect(responsePatient).toHaveProperty('visit_type', 'clinic');
    });
  });

  it('should get a list of patients by location', async () => {
    const response = await app.get('/v1/patient').query({
      location: '???',
    });
    expect(response).toHaveSucceeded();

    expect(response).toHaveSucceeded();
    expect(response.body.total).toEqual(1);

    response.body.results.map(responsePatient => {
      expect(responsePatient).toHaveProperty('location_name', '???');
    });
  });

  it('should get a list of patients by department', async () => {
    const response = await app.get('/v1/patient').query({
      department: '???',
    });
    expect(response).toHaveSucceeded();

    expect(response).toHaveSucceeded();
    expect(response.body.total).toEqual(1);

    response.body.results.map(responsePatient => {
      expect(responsePatient).toHaveProperty('department_name', '???');
    });
  });

  it('should get a list of patients by multiple factors', async () => {

  });

  describe('By visit', () => {
    test.todo('should get the correct patient status'); // admitted, outpatient, triage, deceased, ""
    test.todo('should get a list of outpatients');
    test.todo('should get a list of inpatients sorted by department');
  });
});

