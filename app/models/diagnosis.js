const DiagnosisSchema = {
  name: 'diagnosis',
  properties: {
    active: 'bool',
    date: 'date',
    diagnosis: {         type: 'string',         optional: true       },
    secondaryDiagnosis: {
      type: 'bool',
      default: false
    }
  }
};

module.exports = DiagnosisSchema;
