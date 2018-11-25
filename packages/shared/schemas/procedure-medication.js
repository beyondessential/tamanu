const defaults = require('./defaults');

const ProcedureMedicationSchema = {
  name: 'procedureMedication',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    medication: {
      type: 'string',
      optional: true
    },
    quantity: {
      type: 'string',
      optional: true
    },
  }, defaults)
};

module.exports = ProcedureMedicationSchema;
