import defaults from './defaults';

export const UserSchema = {
  name: 'user',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    deleted: { type: 'bool', default: false },
    displayName: { type: 'string', optional: true },
    email: { type: 'string', optional: true },
    name: { type: 'string', optional: true },
    password: { type: 'string', optional: true },
    userPrefix: { type: 'string', optional: true },
    roles: { type: 'list', objectType: 'userRole' },
    facilities: { type: 'linkingObjects', objectType: 'facility', property: 'users' },
    ...defaults,
  },
  filter: (object, client) => {
    let valid = false;
    object.facilities.forEach(facility => {
      if (facility._id === client.facilityId) valid = true;
    });
    return valid;
  },
};
