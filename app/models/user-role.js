const UserRoleSchema = {
  name: 'userRole',
  properties: {
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
