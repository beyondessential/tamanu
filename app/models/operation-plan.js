const OpPlanSchema = {
  name: 'operationPlan',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    additionalNotes: {
      type: 'string',
      optional: true
    },
    admissionInstructions: {
      type: 'string',
      optional: true
    },
    caseComplexity: {
      type: 'string',
      optional: true
    },
    operationDescription: {
      type: 'string',
      optional: true
    },
    procedures: 'string[]',
    status: {
      type: 'string',
      optional: true
    },
    surgeon: {
      type: 'string',
      optional: true
    },
    diagnoses: {
      type: 'list',
      objectType: 'diagnosis'
    },
  }
};

module.exports = OpPlanSchema;
