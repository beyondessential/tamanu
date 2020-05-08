import defaults from './defaults';

export const SurveyScreenComponentSchema = {
  name: 'surveyScreenComponent',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    questions: {
      type: 'list',
      objectType: 'surveyQuestion',
    },
    componentNumber: {
      type: 'int',
      optional: true,
    },
    answersEnablingFollowUp: {
      type: 'string[]',
      optional: true,
    },
    isFollowUp: {
      type: 'bool',
      default: false,
    },
    ...defaults,
  },
};
