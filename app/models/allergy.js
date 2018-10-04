const AllergySchema = {
  name: 'allergy',
  primaryKey: '_id',
  properties: {
    _id: 'string',
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
