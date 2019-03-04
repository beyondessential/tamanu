const defaults = require('./defaults');

const DiagnosisListSchema = {
  name: 'diagnosisList',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      optional: true,
      indexed: true
    },
    code: {
      type: 'string',
      optional: true,
      indexed: true
    },
    ...defaults,
  }
};

module.exports = DiagnosisListSchema;
