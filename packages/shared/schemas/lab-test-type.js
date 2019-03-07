const defaults = require('./defaults');

const LabTestType = {
  name: 'labTestType',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: 'string',
    senaiteId: 'string?',
    category: 'labTestCategory',
    femaleRange: 'double?[]',
    maleRange: 'double?[]',
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

module.exports = LabTestType;
