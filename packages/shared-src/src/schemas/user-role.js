import defaults from './defaults';

export const UserRoleSchema = {
  name: 'userRole',
  primaryKey: '_id',
  properties: {
    // should be 'user._id:facility._id:role._id'
    _id: 'string',
    facility: {
      type: 'facility',
    },
    role: {
      type: 'role',
    },
    user: {
      type: 'linkingObjects',
      objectType: 'user',
      property: 'roles',
    },
    ...defaults,
  },
  beforeSave: (db, { facility, role, ...object }) => ({
    ...object,
    facility,
    role,
    _id: `${facility._id}:${role._id}`,
  }),
};
