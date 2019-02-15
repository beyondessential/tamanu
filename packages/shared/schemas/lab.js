const defaults = require('./defaults');

const LabSchema = {
  name: 'lab',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    labDate: {
      type: 'date',
      optional: true
    },
    notes: {
      type: 'string',
      optional: true
    },
    requestedBy: {
      type: 'string',
      optional: true
    },
    requestedDate: {
      type: 'date',
      optional: true
    },
    result: {
      type: 'string',
      optional: true
    },
    status: {
      type: 'string',
      optional: true
    },
    ...defaults,
  }
};

module.exports = LabSchema;
