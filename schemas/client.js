const defaults = require('./defaults');

const ClientSchema = {
  name: 'client',
  primaryKey: 'clientId',
  sync: false,
  properties: Object.assign({
    _id: 'string',
    userId: 'string',
    clientId: 'string',
    clientSecret: 'string',
    lastActive: {
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
