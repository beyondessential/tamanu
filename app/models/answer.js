const AnswerSchema = {
  name: 'answer',
  properties: {
    type: 'string',
    questionId: 'string',
    body: { type: 'string', optional: true },
  }
};

module.exports = AnswerSchema;