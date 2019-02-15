const defaults = require('./defaults');

const SurveyScreenSchema = {
  name: 'surveyScreen',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    surveyId: {
      type: 'string',
      optional: true
    },
    screenNumber: {
      type: 'int',
      optional: true
    },
    components: {
      type: 'list',
      objectType: 'surveyScreenComponent'
    },
    ...defaults,
  }
};

module.exports = SurveyScreenSchema;
