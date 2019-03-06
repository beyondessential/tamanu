const defaults = require('./defaults');

const LabRequest = {
  name: 'labRequest',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date?',
    requestedBy: 'user',
    requestedDate: 'date',
    category: 'labTestCategory',
    senaiteId: 'string?',
    sampleId: 'string?',
    notes: 'string?',
    status: 'string?',
    tests: {
      type: 'list',
      objectType: 'labTest'
    },
    visits: {
      type: 'linkingObjects',
      objectType: 'visit',
      property: 'labRequests'
    },
    ...defaults,
  }
};

module.exports = LabRequest;
