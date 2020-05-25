import defaults from './defaults';

export const SurveyResponseSchema = {
  name: 'surveyResponse',
  primaryKey: '_id',
  properties: {
    _id: 'string',

    survey: 'survey',
    assessor: 'user',

    moduleType: 'string?',
    moduleId: 'string?',

    startTime: { type: 'date', default: new Date() },
    endTime: { type: 'date', default: new Date() },

    answers: { type: 'list', objectType: 'surveyAnswer' },

    visit: { type: 'linkingObjects', objectType: 'visit', property: 'surveyResponses' },

    outcome: { type: 'string', default: '' },

    ...defaults,
  },
};
