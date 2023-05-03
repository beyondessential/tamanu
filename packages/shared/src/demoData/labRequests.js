import { randomReferenceId } from './patients';
import { fake } from '../test-helpers/fake';

export const randomLabRequest = async (models, overrides) => {
  const { LabTestType } = models;
  const categoryId = await randomReferenceId(models, 'labTestCategory');
  const labTestTypes = Array(2)
    .fill()
    .map(() => ({ ...fake(LabTestType), labTestCategoryId: categoryId }));
  await Promise.all(labTestTypes.map(t => LabTestType.create(t)));

  return {
    categoryId,
    labTestTypeIds: labTestTypes.map(t => t.id),
    displayId: 'TESTID',
    ...overrides,
  };
};
