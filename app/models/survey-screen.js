const SurveyScreenSchema = {
    name: 'surveyScreen',
    properties: {
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
