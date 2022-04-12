import { createTestContext } from './utilities';
import { AutomaticLabTestResultPublisher } from '../app/tasks/AutomaticLabTestResultPublisher';
import { createDummyPatient } from 'shared/demoData/patients';
import { LAB_REQUEST_STATUSES } from 'shared/constants';
import { result } from 'lodash';

const testConfig = {
  "enabled": true,
  "schedule": "0 0 0 0 0",
  "results": {
    "labTestType-RATPositive": {
      "labTestMethodId": "labTestMethod-RAT",
      "result": "Positive"
    },
    "labTestType-RATNegative": {
      "labTestMethodId": "labTestMethod-RAT",
      "result": "Negative"
    },
    "labTestType-InvalidMethod": {
      "labTestMethodId": "labTestMethod-Invalid",
      "result": "Positive"
    }
  }
};

describe('Lab test publisher', () => {

  let ctx;
  let models;
  let publisher;
  let testCategory;
  let patient;

  const makeLabRequest = async (testType) => {
    const encounter = await models.Encounter.create({
      patientId: patient.id,
      startDate: new Date(),
    });
    const labRequest = await models.LabRequest.create({
      encounterId: encounter.id,
      displayId: `${Math.random()}`,
    });
    if (!await models.LabTestType.findByPk(testType)) {
      await models.LabTestType.create({
        id: testType,
        name: testType,
        code: testType,
        labTestCategoryId: testCategory.id,
      });
    }
    const labTest = await models.LabTest.create({
      labRequestId: labRequest.id,
      labTestTypeId: testType,
    });
    return { encounter, labRequest, labTest };
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    publisher = new AutomaticLabTestResultPublisher(ctx, testConfig);
    patient = await models.Patient.create(createDummyPatient());

    // set up reference data
    testCategory = await models.ReferenceData.create({
      type: 'labTestCategory',
      code: 'testCategory',
      id: 'testCategory',
      name: 'testCategory',
    });
    await models.ReferenceData.create({
      type: 'labTestMethod',
      code: 'labTestMethod-RAT',
      id: 'labTestMethod-RAT',
      name: 'labTestMethod-RAT',
    });
  });

  it('Should publish a positive result', async () => {
    const { labTest, labRequest } = await makeLabRequest('labTestType-RATPositive');
    expect(labTest).toHaveProperty('result', '');
    expect(labTest).toHaveProperty('labTestMethodId', null);
    expect(labRequest).toHaveProperty('status', LAB_REQUEST_STATUSES.RECEPTION_PENDING);

    await publisher.run();

    const updatedLabTest = await models.LabTest.findByPk(labTest.id, { include: ['labRequest'] });
    expect(updatedLabTest).toHaveProperty('result', 'Positive');
    expect(updatedLabTest).toHaveProperty('labTestMethodId', 'labTestMethod-RAT');
    expect(updatedLabTest.labRequest).toHaveProperty('status', LAB_REQUEST_STATUSES.PUBLISHED);
  });

  it('Should publish a positive result', async () => {
    const { labTest, labRequest } = await makeLabRequest('labTestType-RATNegative');
    expect(labTest).toHaveProperty('result', '');
    expect(labTest).toHaveProperty('labTestMethodId', null);
    expect(labRequest).toHaveProperty('status', LAB_REQUEST_STATUSES.RECEPTION_PENDING);

    await publisher.run();

    const updatedLabTest = await models.LabTest.findByPk(labTest.id, { include: ['labRequest'] });
    expect(updatedLabTest).toHaveProperty('result', 'Negative');
    expect(updatedLabTest).toHaveProperty('labTestMethodId', 'labTestMethod-RAT');
    expect(updatedLabTest.labRequest).toHaveProperty('status', LAB_REQUEST_STATUSES.PUBLISHED);
  });

  it('Should ignore an unrelated lab test', async () => {
    const { labTest, labRequest } = await makeLabRequest('labTestType-Unrelated');
    expect(labTest).toHaveProperty('result', '');
    expect(labTest).toHaveProperty('labTestMethodId', null);
    expect(labRequest).toHaveProperty('status', LAB_REQUEST_STATUSES.RECEPTION_PENDING);

    await publisher.run();

    const updatedLabTest = await models.LabTest.findByPk(labTest.id, { include: ['labRequest'] });
    expect(updatedLabTest).toHaveProperty('result', '');
    expect(updatedLabTest).toHaveProperty('labTestMethodId', null);
    expect(updatedLabTest.labRequest).toHaveProperty('status', LAB_REQUEST_STATUSES.RECEPTION_PENDING);
  });

  it('Should error with an invalid method', async () => {
    const { labTest, labRequest } = await makeLabRequest('labTestType-InvalidMethod');
    expect(labTest).toHaveProperty('result', '');
    expect(labTest).toHaveProperty('labTestMethodId', null);
    expect(labRequest).toHaveProperty('status', LAB_REQUEST_STATUSES.RECEPTION_PENDING);

    await publisher.run();

    // ensure the whole thing is rolled back, not just a missing method
    const updatedLabTest = await models.LabTest.findByPk(labTest.id, { include: ['labRequest'] });
    expect(updatedLabTest).toHaveProperty('result', '');
    expect(updatedLabTest).toHaveProperty('labTestMethodId', null);
    expect(updatedLabTest.labRequest).toHaveProperty('status', LAB_REQUEST_STATUSES.RECEPTION_PENDING);
  });

});
