const UserSchema = {
  name: 'hospital',
  primaryKey: '_id',
  sync: false,
  properties: {
    _id: 'string',
    name: 'string',
    key: {
      type: 'string',
      optional: true
    },
    users: 'user[]'
  }
};

module.exports = UserSchema;
