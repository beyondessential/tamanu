import defaults from './defaults';

export const AnswerSchema = {
  name: 'answer',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    type: 'string',
    questionId: 'string',
    body: { type: 'string', optional: true },
    ...defaults,
  },
};
