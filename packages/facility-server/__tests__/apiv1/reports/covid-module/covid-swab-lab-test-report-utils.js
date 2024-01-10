import { randomLabRequest } from '@tamanu/shared/demoData/labRequests';
import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceId,
} from '@tamanu/shared/demoData/patients';
import { formatISO } from 'date-fns';

export const LAB_CATEGORY_ID = 'labTestCategory-COVID';
export const LAB_METHOD_ID = 'labTestMethod-SWAB';

export const LAB_CATEGORY_NAME = 'COVID-19';
export const LAB_METHOD_NAME = 'Swab';

export async function createPatient(models, overrides) {
  const villageId = await randomReferenceId(models, 'village');
  return await models.Patient.create(await createDummyPatient(models, { villageId, ...overrides }));
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
      name: LAB_CATEGORY_NAME,
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
      name: LAB_METHOD_NAME,
    });
  }
}

export async function createCovidTestForPatient(models, patient, testDate, testOverrides, requestOverrides = {}) {
  if (!testDate) {
    testDate = formatISO(new Date(), { representation: 'date' });
  }
  const encounter = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: patient.id }),
  );
  const labRequestData = await randomLabRequest(models, {
    labTestCategoryId: LAB_CATEGORY_ID,
    patientId: patient.id,
    requestedDate: testDate,
    encounterId: encounter.id,
    ...requestOverrides,
  });
  const labRequest = await models.LabRequest.create(labRequestData);
  const labTest = await models.LabTest.create({
    labTestTypeId: labRequestData.labTestTypeIds[0],
    labRequestId: labRequest.id,
    date: testDate,
    completedDate: testDate,
    labTestMethodId: LAB_METHOD_ID,
    ...testOverrides,
  });
  return { labRequest, labTest };
}
