const defaults = require('./defaults');

const HospitalSchema = {
  name: 'hospital',
  primaryKey: '_id',
  // sync: false,
  properties: Object.assign({
    _id: 'string',
    name: 'string',
    key: {
      type: 'string',
      optional: true
    },
    users: {
      type: 'list',
      objectType: 'user'
    }
  }, defaults),
  filter: (object, client) => {
    let valid = false;
    if (object._id === client.hospitalId) valid = true;
    return valid;
  }
};

module.exports = HospitalSchema;
