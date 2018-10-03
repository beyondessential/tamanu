const OpReportSchema = {
  name: 'operationReport',
  properties: {
    additionalNotes: {
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
    surgeon: {
      type: 'string',
      optional: true
    },
    surgeryDate: 'date',
    procedures: 'string[]',
    preOpDiagnoses: {
      type: 'list',
      objectType: 'diagnosis'
    },
    postOpDiagnoses: {
      type: 'list',
      objectType: 'diagnosis'
    },
  }
};

module.exports = OpReportSchema;
