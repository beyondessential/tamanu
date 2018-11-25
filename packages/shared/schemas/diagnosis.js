const defaults = require('./defaults');

const DiagnosisSchema = {
  name: 'diagnosis',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    active: 'bool',
    date: 'date',
    diagnosis: {
      type: 'string',
      optional: true
    },
    secondaryDiagnosis: {
      type: 'bool',
      default: false
    }
  }, defaults)
};

module.exports = DiagnosisSchema;
