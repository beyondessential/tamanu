const defaults = require('./defaults');

const LabTestSchema = {
  name: 'labTest',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    type: 'labTestType',
    result: 'string?',
    ...defaults,
  }
};

module.exports = LabTestSchema;
