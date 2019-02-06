const { SYNC_MODES } = require('../constants');
const defaults = require('./defaults');

const ClientSchema = {
  name: 'client',
  primaryKey: 'clientId',
  sync: SYNC_MODES.OFF,
  properties: Object.assign({
    _id: 'string',
    userId: 'string',
    hospitalId: 'string',
    clientId: 'string',
    clientSecret: 'string',
    lastActive: {
      type: 'int',
      default: 0
    },
    expiry: {
      type: 'int',
      default: 0
    },
    syncOut: {
      type: 'int',
      default: 0
    },
    date: {
      type: 'date',
      default: new Date()
    },
  }, defaults)
};

module.exports = ClientSchema;
