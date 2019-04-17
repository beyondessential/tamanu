import defaults from './defaults';

export const OpReportSchema = {
  name: 'operationReport',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    additionalNotes: {
      type: 'string',
      optional: true,
    },
    caseComplexity: {
      type: 'string',
      optional: true,
    },
    operationDescription: {
      type: 'string',
      optional: true,
    },
    surgeon: {
      type: 'string',
      optional: true,
    },
    surgeryDate: {
      type: 'date',
      optional: true,
    },
    assistant: {
      type: 'string',
      optional: true,
    },
    actionsTaken: 'string[]',
    preOpDiagnoses: {
      type: 'list',
      objectType: 'patientDiagnosis',
    },
    postOpDiagnoses: {
      type: 'list',
      objectType: 'patientDiagnosis',
    },
    visit: {
      type: 'linkingObjects',
      objectType: 'visit',
      property: 'operationReports',
    },
    ...defaults,
  },
};
