const defaults = require('./defaults');

const PatientContactSchema = {
  name: 'patientContact',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
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
  }, defaults)
};

module.exports = PatientContactSchema;
