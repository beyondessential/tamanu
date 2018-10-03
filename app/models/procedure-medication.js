const ProcedureMedicationSchema = {
  name: 'procedureMedication',
  properties: {
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
