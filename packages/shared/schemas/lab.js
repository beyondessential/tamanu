const defaults = require('./defaults');

const LabSchema = {
  name: 'lab',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date?',
    requestedBy: 'user',
    requestedDate: 'date',
    notes: 'string?',
    status: 'string?',
    tests: {
      type: 'list',
      objectType: 'labTest'
    },
    ...defaults,
  }
};

module.exports = LabSchema;
