const defaults = require('./defaults');

const TestSchema = {
  name: 'test',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: 'string',
    category: 'testCategory',
    femaleRange: 'int?[]',
    maleRange: 'int?[]',
    unit:  'string?',
    questionType: 'string?',
    options: 'string?[]',
    sortOrder: {
      type: 'int',
      default: 0
    },
    ...defaults,
  }
};

module.exports = TestSchema;
