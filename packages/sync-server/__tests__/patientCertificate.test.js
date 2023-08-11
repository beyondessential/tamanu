import {
  createDummyPatient,
  createDummyEncounter,
  createDummyPatientAdditionalData,
} from 'shared/demoData/patients';
import { randomLabRequest } from 'shared/demoData/labRequests';
import { fake } from 'shared/test-helpers/fake';
import { LAB_REQUEST_STATUSES, REFERENCE_TYPES } from '@tamanu/constants';
import { makeVaccineCertificate, makeCovidCertificate } from '../app/utils/makePatientCertificate';

import { createTestContext } from './utilities';
import { getCurrentDateString } from 'shared/utils/dateTime';

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

  const pfVaxDrug = await models.ReferenceData.create({
    ...fake(models.ReferenceData),
    type: 'vaccine',
    name: 'Comirnaty',
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
    pfVaxDrug,
  };
}

describe('Certificate', () => {
  let ctx;
  let models;
  let createLabTests;
  let createVaccines;
  let patient;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    const {
      method,
      user,
      labTestType1,
      labTestType2,
      lab,
      department,
      location,
      pfVaxDrug,
    } = await prepopulate(models);

    const patientData = createDummyPatient(models);
    patient = await models.Patient.create(patientData);

    const patientAdditionalData = await createDummyPatientAdditionalData();
    await models.PatientAdditionalData.create({
      patientId: patient.id,
      ...patientAdditionalData,
    });

    const encdata = await createDummyEncounter(models);
    const encounter = await models.Encounter.create({
      patientId: patient.id,
      ...encdata,
    });

    createVaccines = async () => {
      const scheduledPf1 = await models.ScheduledVaccine.create({
        ...fake(models.ScheduledVaccine),
        label: 'COVID-19 Pfizer',
        schedule: 'Dose 1',
        vaccineId: pfVaxDrug.id,
      });

      await models.AdministeredVaccine.create({
        ...fake(models.AdministeredVaccine),
        status: 'GIVEN',
        scheduledVaccineId: scheduledPf1.id,
        encounterId: (
          await models.Encounter.create({
            ...fake(models.Encounter),
            patientId: patient.id,
            locationId: location.id,
            departmentId: department.id,
            examinerId: user.id,
          })
        ).id,
        batch: '001',
        date: new Date(Date.parse('11 January 2021, UTC')),
      });
    };

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
        completedDate: getCurrentDateString(),
      });
      await models.LabTest.create({
        result: 'Positive',
        labTestTypeId: labTestType2.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        completedDate: getCurrentDateString(),
      });
    };
  });

  afterAll(() => ctx.close());

  it('Generates a Patient Covid Certificate', async () => {
    await createLabTests();
    const patientRecord = await models.Patient.findByPk(patient.id);
    const printedBy = 'Initial Admin';
    const result = await makeCovidCertificate('test', patientRecord, printedBy, models, [
      { foo: 'bar' },
    ]);
    expect(result.status).toEqual('success');
  });

  it('Generates a Patient Vaccine Certificate', async () => {
    await createVaccines();
    const patientRecord = await models.Patient.findByPk(patient.id);
    const printedBy = 'Initial Admin';
    const printedAt = new Date();
    const result = await makeVaccineCertificate(
      patientRecord,
      printedBy,
      printedAt,
      models,
      'TEST UVCI',
      [{ foo: 'bar' }],
    );
    expect(result.status).toEqual('success');
  });
});
