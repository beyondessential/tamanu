import defaults from './defaults';

export const SurveyResponseSchema = {
  name: 'surveyResponse',
  primaryKey: '_id',
  properties: {
    _id: 'string',

    surveyId: 'string',
    assessorId: 'string',

    patient: { type: 'linkingObjects', objectType: 'patient', property: 'surveyResponses' },
    
    moduleType: 'string?',
    moduleId: 'string?',

    startTime: { type: 'date', default: new Date() },
    endTime: { type: 'date', default: new Date() },

    answers: { type: 'list', objectType: 'surveyAnswer' },

    ...defaults,
  },
};
