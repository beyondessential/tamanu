const defaults = require('./defaults');

const UserSchema = {
  name: 'user',
  primaryKey: '_id',
  properties: Object.assign({
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
    roles: 'string[]',
    salt: {
      type: 'string',
      optional: true
    },
    userPrefix: {
      type: 'string',
      optional: true
    },
    hospitals: {
      type: 'linkingObjects',
      objectType: 'hospital',
      property: 'users'
    }
  }, defaults),
  filter: (object, client) => {
    let valid = false;
    object.hospitals.forEach(hospital => {
      if (hospital._id === client.hospitalId) valid = true;
    });
    return valid;
  }
};

module.exports = UserSchema;
