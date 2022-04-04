import { randomLabRequest } from 'shared/demoData/labRequests';
import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceId,
} from 'shared/demoData/patients';

export const LAB_CATEGORY_ID = 'labTestCategory-COVID';
export const LAB_METHOD_ID = 'labTestMethod-SWAB';

export async function createPatient(models) {
  const villageId = await randomReferenceId(models, 'village');
  return await models.Patient.create(await createDummyPatient(models, { villageId }));
}

export async function createLabTests(models) {
  const existingCategories = await models.ReferenceData.findAll({
    where: {
      id: LAB_CATEGORY_ID,
    },
  });
  if (!existingCategories.length) {
    await models.ReferenceData.create({
      type: 'labTestCategory',
      id: LAB_CATEGORY_ID,
      code: 'COVID-19',
      name: 'COVID-19',
    });
  }
  const existingMethods = await models.ReferenceData.findAll({
    where: {
      id: LAB_METHOD_ID,
    },
  });
  if (!existingMethods.length) {
    await models.ReferenceData.create({
      type: 'labTestMethod',
      id: LAB_METHOD_ID,
      code: 'METHOD-SWAB',
      name: 'Swab',
    });
  }
}

export async function createCovidTestForPatient(models, patient, testDate) {
  if (!testDate) {
    testDate = new Date().toISOString();
  }
  const encounter = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: patient.id }),
  );
  const labRequestData = await randomLabRequest(models, {
    labTestCategoryId: LAB_CATEGORY_ID,
    patientId: patient.id,
    requestedDate: testDate,
    encounterId: encounter.id,
  });
  const labRequest = await models.LabRequest.create(labRequestData);
  await models.LabTest.create({
    labTestTypeId: labRequestData.labTestTypeIds[0],
    labRequestId: labRequest.id,
    date: testDate,
    labTestMethodId: LAB_METHOD_ID,
  });
  return labRequest;
}
