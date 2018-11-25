const UserSchema = {
  name: 'user',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    derived_key: {
      type: 'string',
      optional: true
    },
    deleted: {
      type: 'bool',
      default: false
    },
    displayName: {
      type: 'string',
      optional: true
    },
    email: {
      type: 'string',
      optional: true
    },
    iterations: 'string[]',
    name: {
      type: 'string',
      optional: true
    },
    password: {
      type: 'string',
      optional: true
    },
    password_scheme: {
      type: 'string',
      optional: true
    },
    password_sha: {
      type: 'string',
      optional: true
    },
    rev: {
      type: 'string',
      optional: true
    },
    roles: 'string[]',
    salt: {
      type: 'string',
      optional: true
    },
    userPrefix: {
      type: 'string',
      optional: true
    },
  }
};

module.exports = UserSchema;
