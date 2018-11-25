const defaults = require('./defaults');

const SurveyScreenComponentSchema = {
  name: 'surveyScreenComponent',
  primaryKey: '_id',
  properties: Object.assign({
  _id: 'string',
    question: {
      type: 'list',
      objectType: 'question'
    },
    componentNumber: {
      type: 'int',
      optional: true
    },
    answersEnablingFollowUp: {
      type: 'string[]',
      optional: true
    },
    isFollowUp: {
      type: 'bool',
      default: false
    },
  }, defaults)
};

module.exports = SurveyScreenComponentSchema;
