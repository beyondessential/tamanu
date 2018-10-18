const ClientSchema = {
  name: 'client',
  primaryKey: 'clientId',
  sync: false,
  properties: {
    _id: 'string',
    userId: 'string',
    clientId: 'string',
    clientSecret: 'string',
    lastSynced: {
      type: 'int',
      default: 0
    },
    syncOut: {
      type: 'int',
      default: 0
    },
    syncIn: {
      type: 'int',
      default: 0
    },
    date: {
      type: 'date',
      default: new Date()
    },
  }
};

module.exports = ClientSchema;
