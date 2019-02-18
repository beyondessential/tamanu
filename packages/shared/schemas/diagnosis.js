const defaults = require('./defaults');

const DiagnosisSchema = {
  name: 'diagnosis',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    active:  {
      type: 'bool',
      optional: true,
      default: true
    },
    date: 'date',
    diagnosis: {
      type: 'string',
      optional: true
    },
    secondaryDiagnosis: {
      type: 'bool',
      default: false
    },
    condition: 'condition?',
    certainty: 'string', // suspected or confirmed
    ...defaults,
  }
};

module.exports = DiagnosisSchema;
