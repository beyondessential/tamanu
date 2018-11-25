const DiagnosisSchema = {
  name: 'diagnosis',
  primaryKey: '_id',
  properties: {
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
  }
};

module.exports = DiagnosisSchema;
