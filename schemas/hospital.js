const defaults = require('./defaults');

const UserSchema = {
  name: 'hospital',
  primaryKey: '_id',
  sync: false,
  properties: Object.assign({
    _id: 'string',
    name: 'string',
    key: {
      type: 'string',
      optional: true
    },
    users: 'user[]'
  }, defaults)
};

module.exports = UserSchema;
