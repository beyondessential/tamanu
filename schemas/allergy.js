const defaults = require('./defaults');

const AllergySchema = {
  name: 'allergy',
  primaryKey: '_id',
  properties: Object.assign({
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
  }, defaults)
};

module.exports = AllergySchema;
