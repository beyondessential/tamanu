const defaults = require('./defaults');
const { has, isEmpty } = require('lodash');

const HospitalSchema = {
  name: 'hospital',
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
    if (object._id === client.hospitalId) valid = true;
    return valid;
  },
};

module.exports = HospitalSchema;
