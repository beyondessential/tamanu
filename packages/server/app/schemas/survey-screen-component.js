const SurveyScreenComponentSchema = {
  name: 'surveyScreenComponent',
  primaryKey: '_id',
  properties: {
  _id: 'string',
    question: {
      type: 'string',
      optional: true
    },
    componentNumber: {
      type: 'string',
      optional: true
    },
    answersEnablingFollowUp: {
      type: 'string',
      optional: true
    },
    isFollowUp: {
      type: 'bool',
      default: false
    },
  }
};

module.exports = SurveyScreenComponentSchema;
