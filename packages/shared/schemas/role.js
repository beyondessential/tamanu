const defaults = require('./defaults');

const RoleSchema = {
  name: 'role',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      optional: true,
    },
    abilities: 'string',
    ...defaults,
  },
};

module.exports = RoleSchema;
