import defaults from './defaults';

export const FacilitySchema = {
  name: 'facility',
  primaryKey: '_id',
  // sync: false,
  properties: {
    _id: 'string',
    name: 'string',
    key: {
      type: 'string',
      optional: true,
    },
    users: {
      type: 'list',
      objectType: 'user',
    },
    objectsFullySynced: 'string?[]',
    ...defaults,
  },
  filter: (object, client) => {
    let valid = false;
    if (object._id === client.facilityId) valid = true;
    return valid;
  },
};
