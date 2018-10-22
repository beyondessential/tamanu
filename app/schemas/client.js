const ClientSchema = {
  name: 'client',
  primaryKey: 'clientId',
  sync: false,
  properties: {
    _id: 'string',
    userId: 'string',
    clientId: 'string',
    clientSecret: 'string',
    active: {
      type: 'bool',
      default: false
    },
    syncOut: {
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
