const defaults = require('./defaults');

const UserRoleSchema = {
  name: 'userRole',
  primaryKey: '_id',
  properties: {
    // should be 'user._id:hospital._id:role._id'
    _id: 'string',
    hospital: {
      type: 'hospital'
    },
    role: {
      type: 'role'
    },
    user: {
      type: 'linkingObjects',
      objectType: 'user',
      property: 'roles'
    },
    ...defaults,
  },
  beforeSave: (db, { hospital, role }) => ({
    ...object,
    _id: `${hospital._id}:${role._id}`
  })
};

module.exports = UserRoleSchema;
