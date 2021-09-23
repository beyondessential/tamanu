import { randomReferenceId } from 'shared/demoData/patients';
import { fake } from 'shared/test-helpers/fake';

export const randomLabRequest = async (models, overrides) => {
  const { LabTestType } = models;
  const labTestTypes = Array(2).map(() => fake(LabTestType));
  await Promise.all(labTestTypes.map(t => LabTestType.create(t)));
  const categoryId = await randomReferenceId(models, 'labTestCategory');

  return {
    categoryId,
    labTestTypeIds: labTestTypes.map(t => t.id),
    displayId: 'TESTID',
    ...overrides,
  };
};
