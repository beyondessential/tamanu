const LAB_TEST_CATEGORY_OTHER = {
  name: 'Other',
  tests: [
    {
      name: 'INR',
      questionType: 'number',
    },
    {
      name: 'Blood Glucose',
      questionType: 'number',
    },
    {
      name: 'Cholesterol',
      questionType: 'number',
    },
    {
      name: 'HbA1C',
      questionType: 'number',
    },
    {
      name: 'CD4',
      questionType: 'number',
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
      questionType: 'number',
    },
    {
      name: 'ALP',
      unit: 'IU',
      maleRange: [35, 130],
      femaleRange: [35, 130],
      questionType: 'number',
    },
    {
      name: 'AST',
      unit: 'IU',
      maleRange: [5, 40],
      femaleRange: [5, 40],
      questionType: 'number',
    },
    {
      name: 'ALT',
      unit: 'IU',
      maleRange: [5, 40],
      femaleRange: [5, 40],
      questionType: 'number',
    },
    {
      name: 'GGT',
      unit: 'IU',
      maleRange: [10, 48],
      femaleRange: [10, 48],
      questionType: 'number',
    },
    {
      name: 'Albumin',
      unit: 'g',
      maleRange: [35, 50],
      femaleRange: [35, 50],
      questionType: 'number',
    },
    {
      name: 'Prothrombin Time',
      unit: 's',
      maleRange: [12, 16],
      femaleRange: [12, 16],
      questionType: 'number',
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
      questionType: 'number',
    },
    {
      name: 'Potassium',
      unit: 'mmol/L',
      maleRange: [3.5, 5.3],
      femaleRange: [3.5, 5.3],
      questionType: 'number',
    },
    {
      name: 'Chloride',
      unit: 'mmol/L',
      maleRange: [95, 106],
      femaleRange: [95, 106],
      questionType: 'number',
    },
    {
      name: 'Bicarbonate',
      unit: 'mmol/L',
      maleRange: [22, 29],
      femaleRange: [22, 29],
      questionType: 'number',
    },
    {
      name: 'Urea',
      unit: 'mmol/L',
      maleRange: [2.5, 7.8],
      femaleRange: [2.5, 7.8],
      questionType: 'number',
    },
    {
      name: 'Calcium',
      unit: 'mmol/L',
      maleRange: [2.2, 2.6],
      femaleRange: [2.2, 2.6],
      questionType: 'number',
    },
    {
      name: 'Magnesium',
      unit: 'mmol/L',
      maleRange: [0.7, 1],
      femaleRange: [0.7, 1],
      questionType: 'number',
    },
    {
      name: 'Phosphate',
      unit: 'mmol/L',
      maleRange: [0.8, 1.5],
      femaleRange: [0.8, 1.5],
      questionType: 'number',
    },
    {
      name: 'Creatinine',
      unit: 'umol/L',
      maleRange: [60, 120],
      femaleRange: [60, 120],
      questionType: 'number',
    },
    {
      name: 'eGFR',
      unit: 'mL/min',
      maleRange: [0, 60],
      femaleRange: [0, 60],
      questionType: 'number',
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
      questionType: 'number',
    },
    {
      name: 'WBC',
      unit: 'x10^3/uL',
      maleRange: [4, 11],
      femaleRange: [4, 11],
      questionType: 'number',
    },
    {
      name: 'PLT',
      unit: 'x10^3/uL',
      maleRange: [150, 400],
      femaleRange: [150, 400],
      questionType: 'number',
    },
    {
      name: 'MCV',
      unit: 'fL',
      maleRange: [78, 100],
      femaleRange: [78, 100],
      questionType: 'number',
    },
    {
      name: 'PCV',
      maleRange: [0.4, 0.52],
      femaleRange: [0.37, 0.47],
      questionType: 'number',
    },
    {
      name: 'RBC',
      unit: 'x10^6/uL',
      maleRange: [4.5, 6.5],
      femaleRange: [3.8, 5.8],
      questionType: 'number',
    },
    {
      name: 'MCH',
      unit: 'pg',
      maleRange: [27, 32],
      femaleRange: [27, 32],
      questionType: 'number',
    },
    {
      name: 'MCHC',
      unit: 'g/dL',
      maleRange: [310, 370],
      femaleRange: [310, 370],
      questionType: 'number',
    },
    {
      name: 'RDW-CV',
      unit: '%',
      maleRange: [11.5, 15],
      femaleRange: [11.5, 15],
      questionType: 'number',
    },
    {
      name: 'Neutrophils',
      maleRange: [2, 7.5],
      femaleRange: [2, 7.5],
      questionType: 'number',
    },
    {
      name: 'Lymphocytes',
      maleRange: [1, 4.5],
      femaleRange: [1, 4.5],
      questionType: 'number',
    },
    {
      name: 'Monocytes',
      maleRange: [0.2, 0.8],
      femaleRange: [0.2, 0.8],
      questionType: 'number',
    },
    {
      name: 'Eosinophils',
      maleRange: [0.04, 0.4],
      femaleRange: [0.04, 0.4],
      questionType: 'number',
    },
    {
      name: 'Basophils',
      maleRange: [0, 0.1],
      femaleRange: [0, 0.1],
      questionType: 'number',
    },
  ],
};

const LAB_TEST_CATEGORY_MALARIA = {
  name: 'Malaria microscopy',
  tests: [
    {
      name: 'Malaria type',
      questionType: 'string',
      options: ['vivax', 'falciparum', 'mixed', 'none'],
    },
    {
      name: 'Parasite count',
      questionType: 'number',
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
    options: t.options && JSON.stringify(t.options),
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
