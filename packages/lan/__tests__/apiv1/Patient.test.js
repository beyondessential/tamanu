import { createDummyPatient } from 'Shared/demoData/patients';
import { getTestContext } from '../utilities';

let app = getTestContext();

describe('Patient', () => {

  beforeAll(async () => {
    app = await app.withPermissions(["readPatient"]);
  });

  test.todo('should reject users with insufficient permissions');
  test.todo('should create an access record');

  test.todo('should get a list of patients matching a filter');

  it('should get the details of a patient', async () => {
    const patient = await app.models.Patient.create(createDummyPatient());
    const result = await app.get(`/v1/patient/${patient.id}`);
    expect(result).not.toHaveRequestError();
    expect(result.body).toHaveProperty('displayId', patient.displayId);
    expect(result.body).toHaveProperty('firstName', patient.firstName);
    expect(result.body).toHaveProperty('lastName', patient.lastName);
  });

  test.todo('should get a list of patient conditions');
  test.todo('should get a list of patient allergies');
  test.todo('should get a list of patient family history entries');
  test.todo('should get a list of patient issues');

  describe('write', () => {
    test.todo('should reject users with insufficient permissions');

    it('should create a new patient', async () => {
      const patient = createDummyPatient();
      const result = await app.post('/v1/patient').send(patient);
      expect(result).not.toHaveRequestError();
      expect(result.body).toHaveProperty('displayId', patient.displayId);
      expect(result.body).toHaveProperty('firstName', patient.firstName);
      expect(result.body).toHaveProperty('lastName', patient.lastName);
    });
    test.todo('should update patient details');

    test.todo('should create a new patient as a new birth');

    test.todo('should add a new condition');
    test.todo('should edit an existing condition');
    test.todo('should add a new allergy');
    test.todo('should edit an existing allergy');
    test.todo('should add a new family history entry');
    test.todo('should edit an existing family history entry');
    test.todo('should add a new issue');
    test.todo('should edit an existing issue');
  });

  describe('merge', () => {
    test.todo('should merge two patients into a single record');
  });

  describe('search', () => {
    test.todo('should get a patient by id');
    test.todo('should get a patient by displayId');

    test.todo('should get a list of patients by name');
    test.todo('should get a list of patients by age range');
    test.todo('should get a list of patients by village');
    test.todo('should get a list of patients by multiple factors');

    test.todo('should get the correct patient status'); // admitted, outpatient, triage, deceased, ""
    test.todo('should get a list of outpatients');
    test.todo('should get a list of inpatients sorted by department');
  });

  test.todo('should get a list of patient visits');
  test.todo('should get a list of patient appointments');
  test.todo('should get a list of patient referrals');

  describe('Death', () => {
    test.todo('should mark a patient as dead');
    test.todo('should not mark a dead patient as dead');
  });
});
