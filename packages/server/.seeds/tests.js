module.exports = (database) => {
  database.write(() => {
    const createdBy = database.findOne('user', 'demo--admin');
    const categoryOther = database.create('labTestCategory', {
      _id: 'test-category-other',
      name: 'Other'
    }, true);

    const categoryLFT = database.create('labTestCategory', {
      _id: 'test-category-lft',
      name: 'LFT'
    }, true);

    const categoryUNE = database.create('labTestCategory', {
      _id: 'test-category-lft',
      name: 'U&E'
    }, true);

    const categoryFBC = database.create('labTestCategory', {
      _id: 'test-category-fbc',
      name: 'FBC'
    }, true);

    const testTypes =  [
      {
          "category": categoryOther,
          "name": "INR",
          "questionType": "number"
      }, {
          "category": categoryOther,
          "name": "Blood Glucose",
          "questionType": "number"
      }, {
          "category": categoryOther,
          "name": "Cholesterol",
          "questionType": "number"
      }, {
          "category": categoryOther,
          "name": "HbA1C",
          "questionType": "number"
      }, {
          "category": categoryOther,
          "name": "CD4",
          "questionType": "number"
      }, {
          "category": categoryLFT,
          "name": "Bilibubin",
          "unit": "umol/L",
          "maleRange": [5, 17],
          "femaleRange": [5, 17],
          "questionType": "number"
      }, {
          "category": categoryLFT,
          "name": "ALP",
          "unit": "IU",
          "maleRange": [35, 130],
          "femaleRange": [35, 130],
          "questionType": "number"
      }, {
          "category": categoryLFT,
          "name": "AST",
          "unit": "IU",
          "maleRange": [5, 40],
          "femaleRange": [5, 40],
          "questionType": "number"
      }, {
          "category": categoryLFT,
          "name": "ALT",
          "unit": "IU",
          "maleRange": [5, 40],
          "femaleRange": [5, 40],
          "questionType": "number"
      }, {
          "category": categoryLFT,
          "name": "GGT",
          "unit": "IU",
          "maleRange": [10, 48],
          "femaleRange": [10, 48],
          "questionType": "number"
      }, {
          "category": categoryLFT,
          "name": "Albumin",
          "unit": "g",
          "maleRange": [35, 50],
          "femaleRange": [35, 50],
          "questionType": "number"
      }, {
          "category": categoryLFT,
          "name": "Prothrombin Time",
          "unit": "s",
          "maleRange": [12, 16],
          "femaleRange": [12, 16],
          "questionType": "number"
      }, {
          "category": categoryUNE,
          "name": "Sodium",
          "unit": "mmol/L",
          "maleRange": [135, 146],
          "femaleRange": [135, 146],
          "questionType": "number"
      }, {
          "category": categoryUNE,
          "name": "Potassium",
          "unit": "mmol/L",
          "maleRange": [3.5, 5.3],
          "femaleRange": [3.5, 5.3],
          "questionType": "number"
      }, {
          "category": categoryUNE,
          "name": "Chloride",
          "unit": "mmol/L",
          "maleRange": [95, 106],
          "femaleRange": [95, 106],
          "questionType": "number"
      }, {
          "category": categoryUNE,
          "name": "Bicarbonate",
          "unit": "mmol/L",
          "maleRange": [22, 29],
          "femaleRange": [22, 29],
          "questionType": "number"
      }, {
          "category": categoryUNE,
          "name": "Urea",
          "unit": "mmol/L",
          "maleRange": [2.5, 7.8],
          "femaleRange": [2.5, 7.8],
          "questionType": "number"
      }, {
          "category": categoryUNE,
          "name": "Calcium",
          "unit": "mmol/L",
          "maleRange": [2.2, 2.6],
          "femaleRange": [2.2, 2.6],
          "questionType": "number"
      }, {
          "category": categoryUNE,
          "name": "Magnesium",
          "unit": "mmol/L",
          "maleRange": [0.7, 1],
          "femaleRange": [0.7, 1],
          "questionType": "number"
      }, {
          "category": categoryUNE,
          "name": "Phosphate",
          "unit": "mmol/L",
          "maleRange": [0.8, 1.5],
          "femaleRange": [0.8, 1.5],
          "questionType": "number"
      }, {
          "category": categoryUNE,
          "name": "Creatinine",
          "unit": "umol/L",
          "maleRange": [60, 120],
          "femaleRange": [60, 120],
          "questionType": "number"
      }, {
          "category": categoryUNE,
          "name": "eGFR",
          "unit": "mL/min",
          "maleRange": [60, 0],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "Haemoglobin",
          "unit": "g/L",
          "maleRange": [135, 180],
          "femaleRange": [115, 160],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "WBC",
          "unit": "x10^9/L",
          "maleRange": [4, 11],
          "femaleRange": [4, 11],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "Platelets",
          "unit": "x10^9/L",
          "maleRange": [150, 400],
          "femaleRange": [150, 400],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "MCV",
          "unit": "fL",
          "maleRange": [78, 100],
          "femaleRange": [78, 100],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "PCV",
          "maleRange": [0.4, 0.52],
          "femaleRange": [0.37, 0.47],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "RBC",
          "unit": "x10^12/L",
          "maleRange": [4.5, 6.5],
          "femaleRange": [3.8, 5.8],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "MCH",
          "unit": "pg",
          "maleRange": [27, 32],
          "femaleRange": [27, 32],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "MCHC",
          "unit": "g/L",
          "maleRange": [310, 370],
          "femaleRange": [310, 370],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "RDW",
          "maleRange": [11.5, 15],
          "femaleRange": [11.5, 15],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "Neutrophils",
          "maleRange": [2, 7.5],
          "femaleRange": [2, 7.5],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "Lymphocytes",
          "maleRange": [1, 4.5],
          "femaleRange": [1, 4.5],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "Monocytes",
          "maleRange": [0.2, 0.8],
          "femaleRange": [0.2, 0.8],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "Eosinophils",
          "maleRange": [0.04, 0.4],
          "femaleRange": [0.04, 0.4],
          "questionType": "number"
      }, {
          "category": categoryFBC,
          "name": "Basophils",
          "maleRange": [0, 0.1],
          "femaleRange": [0, 0.1],
          "questionType": "number"
      }
    ];

    testTypes.forEach((testType, key) => {
      database.create('labTestType', {
        ...testType,
        _id: `test-auto-id-${key}`,
        sortOrder: key,
        createdBy
      }, true);
    });
  });
}
