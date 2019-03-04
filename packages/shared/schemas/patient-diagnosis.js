const defaults = require('./defaults');

const PatientDiagnosisSchema = {
  name: 'patientDiagnosis',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    active:  {
      type: 'bool',
      optional: true,
      default: true
    },
    date: 'date',
    diagnosis: 'diagnosis',
    secondaryDiagnosis: {
      type: 'bool',
      default: false
    },
    condition: 'condition?',
    certainty: 'string', // suspected or confirmed
    ...defaults,
  }
};

module.exports = PatientDiagnosisSchema;
