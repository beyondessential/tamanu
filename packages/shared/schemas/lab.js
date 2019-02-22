const defaults = require('./defaults');

const LabSchema = {
  name: 'lab',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date?',
    requestedBy: 'user',
    requestedDate: 'date',
    category: 'testCategory',
    notes: 'string?',
    status: 'string?',
    tests: {
      type: 'list',
      objectType: 'labTest'
    },
    visits: {
      type: 'linkingObjects',
      objectType: 'visit',
      property: 'labs'
    },
    ...defaults,
  }
};

module.exports = LabSchema;
