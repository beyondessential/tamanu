const moment = require('moment');
const defaults = require('./defaults');

const ViewSchema = {
  name: 'view',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    name: {
      type: 'string',
      optional: true
    },
    filters: {
      type: 'string',
      optional: true
    }
  }, defaults)
};

module.exports = ViewSchema;
