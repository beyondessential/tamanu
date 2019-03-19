const defaults = require('./defaults');

const DiagnosisSchema = {
  name: 'diagnosis',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      optional: true,
      indexed: true,
    },
    code: {
      type: 'string',
      optional: true,
      indexed: true,
    },
    ...defaults,
  },
};

module.exports = DiagnosisSchema;
