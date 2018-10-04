const UserRoleSchema = {
  name: 'userRole',
  primaryKey: '_id',
  properties: {
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
  }
};

module.exports = UserRoleSchema;
