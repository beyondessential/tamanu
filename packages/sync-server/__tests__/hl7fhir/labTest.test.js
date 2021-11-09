import Ajv from 'ajv';

import { createDummyPatient } from 'shared/demoData/patients';
import { randomLabRequest } from 'shared/demoData/labRequests';
import { createTestContext } from '../utilities';
import { validate } from './hl7utilities';

import { 
  labTestToHL7Observation, 
  labTestToHL7DiagnosticReport,
} from '../../app/hl7fhir';

function createDummyLabTest() {
  return {};
}

describe('HL7 Labs', () => {

  let models;
  let labTest;

  beforeAll(async () => {
    const ctx = await createTestContext();
    models = ctx.store.models;
    // const request = await randomLabRequest(models);
    const testData = createDummyLabTest();
    // labTest = await models.LabTest.create(testData);
    labTest = testData;
  });
  
  it('Should validate an observation', async () => {
    const hl7 = labTestToHL7Observation({});
    const { result, errors } = validate(hl7);
    expect(errors).toHaveLength(0);
    expect(result).toEqual(true);
  });
  
  it('Should validate a diagnostic report', async () => {
    const hl7 = labTestToHL7DiagnosticReport({});
    const { result, errors } = validate(hl7);
    expect(errors).toHaveLength(0);
    expect(result).toEqual(true);
  });
  
});
