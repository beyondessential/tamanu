const UserSchema = {
  name: 'user',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    displayName: {
      type: 'string',
      optional: true
    },
    name: {
      type: 'string',
      optional: true
    },
    email: {
      type: 'string',
      optional: true
    },
    password: {
      type: 'string',
      optional: true
    },
    secret: {
      type: 'string',
      optional: true
    },
    roles: {
      type: 'list',
      objectType: 'userRole'
    },
  }
};

module.exports = UserSchema;
