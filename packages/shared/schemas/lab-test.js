const defaults = require('./defaults');

const LabTestSchema = {
  name: 'labTest',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    test: 'test',
    result: 'string?',
    ...defaults,
  }
};

module.exports = LabTestSchema;
