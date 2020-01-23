import { createTestContext } from '../utilities';

const app = createTestContext();

describe('Triage', () => {
  test.todo('should admit a patient to triage');
  test.todo('should close a triage by progressing a visit');
  test.todo('should close a triage by discharging');

  test.todo('should get a list of all triages with relevant attached data');
  test.todo('should filter triages by location');
  test.todo('should filter triages by age range');
  test.todo('should filter triages by chief complaint');
});
