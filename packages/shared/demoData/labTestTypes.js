const LAB_TEST_CATEGORY_OTHER = {
  _id: 'test-category-other',
  name: 'Other',
};

const LAB_TEST_CATEGORY_LFT = {
  _id: 'test-category-lft',
  name: 'LFT',
};

const LAB_TEST_CATEGORY_U_AND_E = {
  _id: 'test-category-une',
  name: 'U&E',
};

const LAB_TEST_CATEGORY_FBC = {
  _id: 'test-category-fbc',
  name: 'FBC',
};

const LAB_TEST_CATEGORY_MALARIA = {
  _id: 'test-category-malaria',
  name: 'Malaria microscopy',
};

const LAB_TEST_TYPES = [
  {
    category: LAB_TEST_CATEGORY_OTHER,
    name: 'INR',
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_OTHER,
    name: 'Blood Glucose',
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_OTHER,
    name: 'Cholesterol',
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_OTHER,
    name: 'HbA1C',
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_OTHER,
    name: 'CD4',
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_LFT,
    name: 'Bilibubin',
    unit: 'umol/L',
    maleRange: [5, 17],
    femaleRange: [5, 17],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_LFT,
    name: 'ALP',
    unit: 'IU',
    maleRange: [35, 130],
    femaleRange: [35, 130],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_LFT,
    name: 'AST',
    unit: 'IU',
    maleRange: [5, 40],
    femaleRange: [5, 40],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_LFT,
    name: 'ALT',
    unit: 'IU',
    maleRange: [5, 40],
    femaleRange: [5, 40],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_LFT,
    name: 'GGT',
    unit: 'IU',
    maleRange: [10, 48],
    femaleRange: [10, 48],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_LFT,
    name: 'Albumin',
    unit: 'g',
    maleRange: [35, 50],
    femaleRange: [35, 50],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_LFT,
    name: 'Prothrombin Time',
    unit: 's',
    maleRange: [12, 16],
    femaleRange: [12, 16],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_U_AND_E,
    name: 'Sodium',
    unit: 'mmol/L',
    maleRange: [135, 146],
    femaleRange: [135, 146],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_U_AND_E,
    name: 'Potassium',
    unit: 'mmol/L',
    maleRange: [3.5, 5.3],
    femaleRange: [3.5, 5.3],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_U_AND_E,
    name: 'Chloride',
    unit: 'mmol/L',
    maleRange: [95, 106],
    femaleRange: [95, 106],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_U_AND_E,
    name: 'Bicarbonate',
    unit: 'mmol/L',
    maleRange: [22, 29],
    femaleRange: [22, 29],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_U_AND_E,
    name: 'Urea',
    unit: 'mmol/L',
    maleRange: [2.5, 7.8],
    femaleRange: [2.5, 7.8],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_U_AND_E,
    name: 'Calcium',
    unit: 'mmol/L',
    maleRange: [2.2, 2.6],
    femaleRange: [2.2, 2.6],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_U_AND_E,
    name: 'Magnesium',
    unit: 'mmol/L',
    maleRange: [0.7, 1],
    femaleRange: [0.7, 1],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_U_AND_E,
    name: 'Phosphate',
    unit: 'mmol/L',
    maleRange: [0.8, 1.5],
    femaleRange: [0.8, 1.5],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_U_AND_E,
    name: 'Creatinine',
    unit: 'umol/L',
    maleRange: [60, 120],
    femaleRange: [60, 120],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_U_AND_E,
    name: 'eGFR',
    unit: 'mL/min',
    maleRange: [60, 0],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'HGB',
    unit: 'g/dL',
    maleRange: [135, 180],
    femaleRange: [115, 160],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'WBC',
    unit: 'x10^3/uL',
    maleRange: [4, 11],
    femaleRange: [4, 11],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'PLT',
    unit: 'x10^3/uL',
    maleRange: [150, 400],
    femaleRange: [150, 400],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'MCV',
    unit: 'fL',
    maleRange: [78, 100],
    femaleRange: [78, 100],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'PCV',
    maleRange: [0.4, 0.52],
    femaleRange: [0.37, 0.47],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'RBC',
    unit: 'x10^6/uL',
    maleRange: [4.5, 6.5],
    femaleRange: [3.8, 5.8],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'MCH',
    unit: 'pg',
    maleRange: [27, 32],
    femaleRange: [27, 32],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'MCHC',
    unit: 'g/dL',
    maleRange: [310, 370],
    femaleRange: [310, 370],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'RDW-CV',
    unit: '%',
    maleRange: [11.5, 15],
    femaleRange: [11.5, 15],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'Neutrophils',
    maleRange: [2, 7.5],
    femaleRange: [2, 7.5],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'Lymphocytes',
    maleRange: [1, 4.5],
    femaleRange: [1, 4.5],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'Monocytes',
    maleRange: [0.2, 0.8],
    femaleRange: [0.2, 0.8],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'Eosinophils',
    maleRange: [0.04, 0.4],
    femaleRange: [0.04, 0.4],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_FBC,
    name: 'Basophils',
    maleRange: [0, 0.1],
    femaleRange: [0, 0.1],
    questionType: 'number',
  },
  {
    category: LAB_TEST_CATEGORY_MALARIA,
    name: 'Malaria type',
    questionType: 'string',
    options: ['vivax', 'falciparum', 'mixed', 'none'],
  },
  {
    category: LAB_TEST_CATEGORY_MALARIA,
    name: 'Parasite count',
    questionType: 'number',
  },
];

export const generateLabTestTypes = db =>
  LAB_TEST_TYPES.map(({ category, ...restOfTestType }) => {
    const labTestCategory =
      db.objectForPrimaryKey('labTestCategory', category._id) ||
      db.create('labTestCategory', category);
    return {
      category: labTestCategory,
      ...restOfTestType,
    };
  });
