import Ajv from 'ajv';

import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import { randomLabRequest } from 'shared/demoData/labRequests';
import { createTestContext } from '../utilities';
import { validate } from './hl7utilities';

import { 
  labTestToHL7Observation, 
  labTestToHL7DiagnosticReport,
} from '../../app/hl7fhir';

async function prepopulate(models) {
  // test category
  const category = await models.ReferenceData.create({
    type: 'labTestCategory',
    name: 'Test Category',
    code: 'testLabTestCategory',
  });
  const method = await models.ReferenceData.create({
    type: 'labTestMethod',
    name: 'Test Method',
    code: 'testLabTestMethod',
  });
  const labTestType = await models.LabTestType.create({
    labTestCategoryId: category.id,
    code: 'TESTTESTTYPE',
    name: 'Test Test Type',
  });

  // user
  const user = await models.User.create({
    displayName: 'Test User',
    email: 'testuser@test.test',
  });

  // facility
  const facility = await models.Facility.create({
    name: 'Test facility',
    code: 'TESTFACILITY',
  });
  const location = await models.Location.create({
    name: 'Test location',
    code: 'TESTLOCATION',
    facilityId: facility.id,
  });
  const department = await models.Department.create({
    name: 'Test department',
    code: 'TESTDEPARTMENT',
    facilityId: facility.id,
  });

  return { category, method, labTestType, facility, location, department, user };
}

describe('HL7 Labs', () => {

  let models;
  let labTest;
  let patient;

  beforeAll(async () => {
    const ctx = await createTestContext();
    models = ctx.store.models;

    const { method } = await prepopulate(models);

    const patientData = await createDummyPatient(models);
    patient = await models.Patient.create(patientData);

    const encdata = await createDummyEncounter(models);
    const encounter = await models.Encounter.create({
      patientId: patient.id,
      ...encdata,
    });

    const requestData = await randomLabRequest(models);
    const labRequest = await models.LabRequest.createWithTests({
      ...requestData,
      encounterId: encounter.id,
    });
    const tests = await labRequest.getTests();
    labTest = tests[0];

    labRequest.status = 'published';
    await labRequest.save();

    // method currently needs to be set manually after creation
    // (the workflow is, it would be set when entering the results)
    labTest.status = 'published';
    labTest.labTestMethodId = method.id;
    await labTest.save();
  });
  
  it('Should produce valid hl7 data for an Observation', async () => {
    const hl7 = labTestToHL7Observation(labTest, patient);
    const { result, errors } = validate(hl7);
    expect(errors).toHaveLength(0);
    expect(result).toEqual(true);
  });
  
  it('Should produce valid hl7 data for a DiagnosticReport', async () => {
    const hl7 = await labTestToHL7DiagnosticReport(labTest);
    const { result, errors } = validate(hl7);
    expect(errors).toHaveLength(0);
    expect(result).toEqual(true);
  });

  describe('Incomplete statuses', () => {
    it('Should produce a null Observation', async () => {
      const hl7 = await labTestToHL7Observation(labTest);
      expect(hl7).toEqual(null);
    });

    it('Should produce a DiagnosticReport with an empty result', async () => {
      const hl7 = await labTestToHL7DiagnosticReport(labTest);
      expect(hl7.result).toHaveLength(0);
    });
  });

  it('Should prefer laboratory info over examiner when available', async () => {
    
  });
  
});
