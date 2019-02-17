const defaults = require('./defaults');

const DiagnosisSchema = {
  name: 'diagnosis',
  primaryKey: '_id',
  properties: Object.assign({
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
    certainty: 'string', // suspected or confirmed
  }, defaults)
};

module.exports = DiagnosisSchema;
