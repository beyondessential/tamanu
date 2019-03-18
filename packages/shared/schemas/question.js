const defaults = require('./defaults');

const QuestionSchema = {
  name: 'question',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    text: 'string',
    indicator: {
      type: 'string',
      optional: true,
    },
    imageData: {
      type: 'string',
      optional: true,
    },
    type: {
      type: 'string',
      optional: true,
    },
    options: 'string[]',
    code: {
      type: 'string',
      optional: true,
    },
    details: {
      type: 'string',
      optional: true,
    },
    params: 'string[]',
    ...defaults,
  },
};

module.exports = QuestionSchema;
