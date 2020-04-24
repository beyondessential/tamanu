import defaults from './defaults';

export const QuestionSchema = {
  name: 'surveyQuestion',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    text: 'string',
    indicator: 'string?',
    imageData: 'string?',
    type: 'string',
    options: 'string?',
    optionLabels: 'string?',
    code: 'string?',
    params: 'string[]',

    // TODO: sort out unknown fields in XSLX
    detail: 'string?',
    detailLabel: 'string?',
    visibilityCriteria: 'string?',
    validationCriteria: 'string?',
    config: 'string?',
    optionColors: 'string?',
    optionSet: 'string?',
    questionLabel: 'string?',

    ...defaults,
  },
};
