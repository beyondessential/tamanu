import { randomReferenceId } from './patients';
import { fake } from '../test-helpers/fake';

export const randomLabRequest = async (models, overrides) => {
  const categoryId = overrides?.categoryId || (await randomReferenceId(models, 'labTestCategory'));
  const labTestTypes = await createLabTestTypes(models, categoryId);

  return {
    categoryId,
    labTestTypeIds: labTestTypes.map(t => t.id),
    displayId: 'TESTID',
    ...overrides,
  };
};

export const createLabTestTypes = async (models, categoryId) => {
  const labTestCategoryId = categoryId || (await randomReferenceId(models, 'labTestCategory'));
  const { LabTestType } = models;
  const labTestTypes = Array(2)
    .fill()
    .map(() => ({ ...fake(LabTestType), labTestCategoryId }));
  const createdLabTestTypes = await Promise.all(labTestTypes.map(t => LabTestType.create(t)));
  return createdLabTestTypes;
};
