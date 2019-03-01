const defaults = require('./defaults');

const OpReportSchema = {
  name: 'operationReport',
  primaryKey: '_id',
  properties: {
    _id: 'string',
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
    surgeryDate: {
      type: 'date',
      optional: true
    },
    procedures: 'string[]',
    preOpDiagnoses: {
      type: 'list',
      objectType: 'diagnosis'
    },
    postOpDiagnoses: {
      type: 'list',
      objectType: 'diagnosis'
    },
    ...defaults,
  }
};

module.exports = OpReportSchema;
