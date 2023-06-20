import { LAB_TEST_RESULT_TYPES } from '../constants';

const LAB_TEST_CATEGORY_OTHER = {
  name: 'Other',
  tests: [
    {
      name: 'INR',
      resultType: LAB_TEST_RESULT_TYPES.NUMBER,
    },
    {
      name: 'Blood Glucose',
      resultType: LAB_TEST_RESULT_TYPES.NUMBER,
    },
  ],
};

const LAB_TEST_CATEGORY_LFT = {
  name: 'LFT',
  tests: [
    {
      name: 'Bilibubin',
      unit: 'umol/L',
      maleRange: [5, 17],
      femaleRange: [5, 17],
      resultType: LAB_TEST_RESULT_TYPES.NUMBER,
    },
    {
      name: 'ALP',
      unit: 'IU',
      maleRange: [35, 130],
      femaleRange: [35, 130],
      resultType: LAB_TEST_RESULT_TYPES.NUMBER,
    },
  ],
};

const LAB_TEST_CATEGORY_U_AND_E = {
  name: 'U&E',
  tests: [
    {
      name: 'Sodium',
      unit: 'mmol/L',
      maleRange: [135, 146],
      femaleRange: [135, 146],
      resultType: LAB_TEST_RESULT_TYPES.NUMBER,
    },
    {
      name: 'Potassium',
      unit: 'mmol/L',
      maleRange: [3.5, 5.3],
      femaleRange: [3.5, 5.3],
      resultType: LAB_TEST_RESULT_TYPES.NUMBER,
    },
  ],
};

const LAB_TEST_CATEGORY_FBC = {
  name: 'FBC',
  tests: [
    {
      name: 'HGB',
      unit: 'g/dL',
      maleRange: [135, 180],
      femaleRange: [115, 160],
      resultType: LAB_TEST_RESULT_TYPES.NUMBER,
    },
    {
      name: 'WBC',
      unit: 'x10^3/uL',
      maleRange: [4, 11],
      femaleRange: [4, 11],
      resultType: LAB_TEST_RESULT_TYPES.NUMBER,
    },
  ],
};

const LAB_TEST_CATEGORY_MALARIA = {
  name: 'Malaria microscopy',
  tests: [
    {
      name: 'Malaria type',
      resultType: LAB_TEST_RESULT_TYPES.FREE_TEXT,
      options: ['vivax', 'falciparum', 'mixed', 'none'],
    },
  ],
};

const ALL_CATEGORIES = [
  LAB_TEST_CATEGORY_LFT,
  LAB_TEST_CATEGORY_MALARIA,
  LAB_TEST_CATEGORY_FBC,
  LAB_TEST_CATEGORY_U_AND_E,
  LAB_TEST_CATEGORY_OTHER,
];

const generateTestObject = t => {
  const [maleMin, maleMax] = t.maleRange || [];
  const [femaleMin, femaleMax] = t.femaleRange || [];

  return {
    ...t,
    maleMin,
    maleMax,
    femaleMin,
    femaleMax,
    code: t.name,
    options: t.options && t.options.join(', '),
  };
};

const createCategory = async (models, { tests, name }) => {
  const { LabTestType, ReferenceData } = models;

  const category = await ReferenceData.create({
    name,
    code: name,
    type: 'labTestCategory',
  });

  const { id } = category;

  return Promise.all(
    tests.map(t =>
      LabTestType.create({
        ...generateTestObject(t),
        labTestCategoryId: id,
      }),
    ),
  );
};

export function seedLabTests(models) {
  return Promise.all(ALL_CATEGORIES.map(c => createCategory(models, c)));
}
