const defaults = require('./defaults');

const UserRoleSchema = {
  name: 'userRole',
  primaryKey: '_id',
  properties: Object.assign({
    _id: 'string',
    name: {
      type: 'string',
      optional: true
    },
    capabilities: 'string[]',
    navRoute: {
      type: 'string',
      optional: true
    }
  }, defaults)
};

module.exports = UserRoleSchema;
