const defaults = require('./defaults');

const SurveyResponseSchema = {
  name: 'surveyResponse',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    surveyId: {
      type: 'string',
      optional: true
    },
    patientId: {
      type: 'string',
      optional: true
    },
    userId: {
      type: 'string',
      optional: true
    },
    moduleType: {
      type: 'string',
      optional: true
    },
    moduleId: {
      type: 'string',
      optional: true
    },
    assessorName: {
      type: 'string',
      optional: true
    },
    startTime: {
      type: 'string',
      optional: true
    },
    endTime: {
      type: 'string',
      optional: true
    },
    metadata: {
      type: 'string',
      optional: true
    },
    answers: {
      type: 'list',
      objectType: 'answer'
    },
    ...defaults,
  }
};

module.exports = SurveyResponseSchema;
