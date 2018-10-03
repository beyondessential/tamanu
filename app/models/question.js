const QuestionSchema = {
  name: 'question',
  properties: {
    test: {
      type: 'string',
      optional: true
    },
    indicator: {
      type: 'string',
      optional: true
    },
    imageData: {
      type: 'string',
      optional: true
    },
    type: {
      type: 'string',
      optional: true
    },
    options: 'string[]',
    code: {
      type: 'string',
      optional: true
    },
    details: {
      type: 'string',
      optional: true
    },
    params: 'string[]',
  }
};

module.exports = QuestionSchema;
