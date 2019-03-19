const defaults = require('./defaults');

const ViewSchema = {
  name: 'view',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      optional: true,
      indexed: true,
    },
    filters: {
      type: 'string',
      optional: true,
    },
    ...defaults,
  },
};

module.exports = ViewSchema;
