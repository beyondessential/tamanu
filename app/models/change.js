const ChangeSchema = {
  name: 'change',
  primaryKey: '_id',
  sync: false,
  properties: {
    _id: 'string',
    action: 'string',
    recordId: 'string',
    recordType: 'string',
    timestamp: 'int',
  }
};

module.exports = ChangeSchema;
