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

  it('should get a list of patients by name', async () => {
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

  it('should get a list of patients by age range', async () => {

  });

  it('should get a list of patients by village', async () => {

  });

  it('should get a list of patients by multiple factors', async () => {

  });

  describe('By visit', () => {
    test.todo('should get the correct patient status'); // admitted, outpatient, triage, deceased, ""
    test.todo('should get a list of outpatients');
    test.todo('should get a list of inpatients sorted by department');
  });
});

