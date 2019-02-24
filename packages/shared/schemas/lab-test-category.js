const defaults = require('./defaults');

const TestCategorySchema = {
  name: 'labTestCategory',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: 'string',
    ...defaults,
  }
};

module.exports = TestCategorySchema;
