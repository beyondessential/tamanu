import Chance from 'chance';

import { randomReferenceId } from './patients';

const chance = new Chance();

function randomLabTestCategory(overrides = {}) {
  const name = chance.word();
  return {
    name,
    code: name,
    type: 'labTestCategory',
    availableFacilities: null,
    ...overrides,
  };
}

function randomLabTestTypeFields(overrides = {}) {
  const name = chance.word();
  return {
    code: name,
    name,
    unit: chance.pickone(['mmol/L', 'umol/L', 'IU']),
    isSensitive: false,
    externalCode: chance.word(),
    availableFacilities: null,
    ...overrides,
  };
}

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
    randomLabTestCategory({ type: 'labTestCategory' }),
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
    .map(() => ({ ...randomLabTestTypeFields(), labTestCategoryId, ...overrides }));
  const createdLabTestTypes = await Promise.all(labTestTypes.map((t) => LabTestType.create(t)));
  return createdLabTestTypes;
};
