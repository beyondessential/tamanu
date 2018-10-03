const PatientContactSchema = {
  name: 'patientContact',
  properties: {
    name: {
      type: 'string',
      optional: true
    },
    phone: {
      type: 'string',
      optional: true
    },
    email: {
      type: 'string',
      optional: true
    },
    relationship: {
      type: 'string',
      optional: true
    },
  }
};

module.exports = PatientContactSchema;
