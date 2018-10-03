const AllergySchema = {
  name: 'allergy',
  properties: {
    name: 'string',
    icd9CMCode: {
      type: 'string',
      optional: true
    },
    icd10Code: {
      type: 'string',
      optional: true
    },
  }
};

module.exports = AllergySchema;
