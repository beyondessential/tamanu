import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import { randomLabRequest } from 'shared/demoData/labRequests';
import { LAB_REQUEST_STATUSES, REFERENCE_TYPES } from 'shared/constants';

import { createTestContext } from './utilities';
import { makePatientCertificate } from '../app/utils/certificates';

async function prepopulate(models) {
  const lab = await models.ReferenceData.create({
    type: REFERENCE_TYPES.LAB_TEST_LABORATORY,
    name: 'Test Laboratory',
    code: 'TESTLABORATORY',
  });
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
  const labTestType1 = await models.LabTestType.create({
    labTestCategoryId: category.id,
    name: 'Test Test Type 1',
    code: 'TESTTESTTYPE1',
  });

  const labTestType2 = await models.LabTestType.create({
    labTestCategoryId: category.id,
    name: 'Test Test Type2',
    code: 'TESTTESTTYPE2',
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

  return {
    category,
    method,
    labTestType1,
    labTestType2,
    facility,
    location,
    department,
    user,
    lab,
  };
}

describe.only('Certificate', () => {
  let ctx;
  let models;
  let createLabTests;
  let patient;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    const { method, user, labTestType1, labTestType2, lab } = await prepopulate(models);

    const patientData = await createDummyPatient(models);
    patient = await models.Patient.create(patientData);

    const encdata = await createDummyEncounter(models);
    const encounter = await models.Encounter.create({
      patientId: patient.id,
      ...encdata,
    });

    createLabTests = async () => {
      const requestData = await randomLabRequest(models);
      const labRequest = await models.LabRequest.create({
        ...requestData,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
        requestedById: user.id,
        labTestLaboratoryId: lab.id,
      });
      await models.LabTest.create({
        result: 'Positive',
        labTestTypeId: labTestType1.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        completedDate: new Date().toISOString(),
      });
      await models.LabTest.create({
        result: 'Positive',
        labTestTypeId: labTestType2.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        completedDate: new Date().toISOString(),
      });
    };
  });

  afterAll(() => ctx.close());

  it('Generates a Patient Covid Certificate', async () => {
    await createLabTests();
    const patientRecord = await models.Patient.findByPk(patient.id);
    await makePatientCertificate(patientRecord);
  });

  it.skip('Get Lab Requests By Patient Id', async () => {
    await createLabTests();

    const data = await models.LabRequest.findAll({
      raw: true,
      nest: true,
      include: [
        { association: 'requestedBy' },
        {
          association: 'tests',
          include: [{ association: 'labTestMethod' }, { association: 'labTestType' }],
        },
        { association: 'laboratory' },
        {
          association: 'encounter',
          required: true,
          include: [
            { association: 'examiner' },
            {
              association: 'patient',
              where: { id: patient.id },
            },
          ],
        },
      ],
    });

    console.log('LAB REQUESTS: ', data);
    // expect(errors).toHaveLength(0);
    expect(true).toEqual(true);
  });

  it.skip('Get Lab Tests By Patient Id', async () => {
    await createLabTests();

    const data = await models.LabTest.findAll({
      raw: true,
      nest: true,
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
                  where: { id: patient.id },
                },
              ],
            },
          ],
        },
      ],
    });

    console.log('LAB TEST: ', data);
    // expect(errors).toHaveLength(0);
    expect(true).toEqual(true);
  });
});
