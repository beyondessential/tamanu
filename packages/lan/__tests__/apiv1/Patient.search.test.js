import { createDummyPatient } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

describe('Patient search', () => {
  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
  });

  test.todo('should get a patient by displayId');

  test.todo('should get a list of patients by name');
  test.todo('should get a list of patients by age range');
  test.todo('should get a list of patients by village');
  test.todo('should get a list of patients by multiple factors');

  describe('By visit', () => {
    test.todo('should get the correct patient status'); // admitted, outpatient, triage, deceased, ""
    test.todo('should get a list of outpatients');
    test.todo('should get a list of inpatients sorted by department');
  });
});

