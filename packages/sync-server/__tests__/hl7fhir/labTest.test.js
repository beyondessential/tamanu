import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import { randomLabRequest } from 'shared/demoData/labRequests';
import { LAB_TEST_STATUSES, REFERENCE_TYPES } from 'shared/constants';

import { createTestContext } from '../utilities';
import { validate } from './hl7utilities';

import { labTestToHL7Observation, labTestToHL7DiagnosticReport } from '../../app/hl7fhir';

async function prepopulate(models) {
  // test category
  const category = await models.ReferenceData.create({
    type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
    name: 'Test Category',
    code: 'testLabTestCategory',
  });
  const method = await models.ReferenceData.create({
    type: REFERENCE_TYPES.LAB_TEST_METHOD,
    name: 'Test Method',
    code: 'testLabTestMethod',
  });
  const labTestType = await models.LabTestType.create({
    labTestCategoryId: category.id,
    name: 'Test Test Type',
    code: 'TESTTESTTYPE',
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
  let ctx;
  let models;
  let createLabTest;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    const { method, labTestType } = await prepopulate(models);

    const patientData = await createDummyPatient(models);
    const patient = await models.Patient.create(patientData);

    const encdata = await createDummyEncounter(models);
    const encounter = await models.Encounter.create({
      patientId: patient.id,
      ...encdata,
    });

    createLabTest = async (data, requestOverrides = {}) => {
      const requestData = await randomLabRequest(models);
      const labRequest = await models.LabRequest.create({
        ...requestData,
        encounterId: encounter.id,
        ...requestOverrides,
      });
      const labTest = await models.LabTest.create({
        status: LAB_TEST_STATUSES.PUBLISHED,
        result: 'Positive',
        labTestTypeId: labTestType.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        ...data,
      });
      return models.LabTest.findByPk(labTest.id, {
        include: [
          { association: 'labTestType' },
          { association: 'labTestMethod' },
          {
            association: 'labRequest',
            required: true,
            include: [
              { association: 'laboratory' },
              {
                association: 'encounter',
                required: true,
                include: [
                  { association: 'examiner' },
                  {
                    association: 'patient',
                  },
                ],
              },
            ],
          },
        ],
      });
    };
  });

  afterAll(() => ctx.close());

  it('Should produce valid hl7 data for an Observation', async () => {
    const labTest = await createLabTest({});
    const hl7 = labTestToHL7Observation(labTest);
    const { result, errors } = validate(hl7);
    expect(errors).toHaveLength(0);
    expect(result).toEqual(true);
  });

  it('Should produce valid hl7 data for a DiagnosticReport', async () => {
    const labTest = await createLabTest({});
    const hl7 = labTestToHL7DiagnosticReport(labTest);
    const { result, errors } = validate(hl7);
    expect(errors).toHaveLength(0);
    expect(result).toEqual(true);
  });

  describe('Incomplete statuses', () => {
    it('Should produce a null Observation', async () => {
      const labTest = await createLabTest({
        status: LAB_TEST_STATUSES.RECEPTION_PENDING,
      });
      const hl7 = labTestToHL7Observation(labTest);
      expect(hl7).toEqual(null);
    });

    it('Should produce a DiagnosticReport with an empty result', async () => {
      const labTest = await createLabTest({
        status: LAB_TEST_STATUSES.RECEPTION_PENDING,
      });
      const hl7 = labTestToHL7DiagnosticReport(labTest);
      expect(hl7.result).toHaveLength(0);
    });
  });

  it('Should prefer laboratory info over examiner when available', async () => {
    const lab = await models.ReferenceData.create({
      type: REFERENCE_TYPES.LAB_TEST_LABORATORY,
      name: 'Test Laboratory',
      code: 'TESTLABORATORY',
    });

    const labTest = await createLabTest(
      {},
      {
        labTestLaboratoryId: lab.id,
      },
    );

    const hl7 = labTestToHL7DiagnosticReport(labTest);
    expect(hl7.performer[0]).toHaveProperty('display', 'Test Laboratory');
  });

  it('Should throw if an invalid result type is given', async () => {
    const labTest = await createLabTest({
      result: 'Not real',
    });

    try {
      labTestToHL7Observation(labTest);
      throw new Error("Didn't throw!");
    } catch (e) {
      expect(e.message).toMatch('Test coding was not one of');
    }
  });
});
