const defaults = require('./defaults');

const AnswerSchema = {
  name: 'answer',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    type: 'string',
    questionId: 'string',
    body: { type: 'string', optional: true },
  }, defaults)
};

module.exports = AnswerSchema;
