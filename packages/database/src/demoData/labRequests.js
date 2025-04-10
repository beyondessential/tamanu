import { randomReferenceId } from './patients';
import { fake } from '@tamanu/fake-data/fake';

export const randomLabRequest = async (models, overrides) => {
  const categoryId = overrides?.categoryId || (await randomReferenceId(models, 'labTestCategory'));
  const labTestTypes = await createLabTestTypes(models, categoryId);

  return {
    categoryId,
    labTestTypeIds: labTestTypes.map((t) => t.id),
    displayId: 'TESTID',
    ...overrides,
  };
};

export const randomSensitiveLabRequest = async (models, overrides) => {
  // Always create a new category. A category should have either sensitive or non sensitive tests
  const { id: sensitiveCategoryId } = await models.ReferenceData.create(
    fake(models.ReferenceData, { type: 'labTestCategory' }),
  );
  const labTestTypes = await createLabTestTypes(models, sensitiveCategoryId, { isSensitive: true });

  return {
    categoryId: sensitiveCategoryId,
    labTestTypeIds: labTestTypes.map((t) => t.id),
    displayId: 'TESTID',
    ...overrides,
  };
};

export const createLabTestTypes = async (models, categoryId, overrides) => {
  const labTestCategoryId = categoryId || (await randomReferenceId(models, 'labTestCategory'));
  const { LabTestType } = models;
  const labTestTypes = Array(2)
    .fill()
    .map(() => ({ ...fake(LabTestType), labTestCategoryId, ...overrides }));
  const createdLabTestTypes = await Promise.all(labTestTypes.map((t) => LabTestType.create(t)));
  return createdLabTestTypes;
};
