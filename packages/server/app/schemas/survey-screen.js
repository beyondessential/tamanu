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
      type: 'string',
      optional: true
    },
    components: {
      type: 'list',
      objectType: 'surveyScreenComponent'
    }
  }
};

module.exports = SurveyScreenSchema;
