const ProcedureMedicationSchema = {
  name: 'procedureMedication',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    medication: {
      type: 'string',
      optional: true
    },
    quantity: {
      type: 'string',
      optional: true
    },
  }
};

module.exports = ProcedureMedicationSchema;
