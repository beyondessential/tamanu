const defaults = require('./defaults');
const { has, isEmpty } = require('lodash');

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
    },
    objectsFullySynced: {
      type: 'string',
      default: '[]'
    }
  }, defaults),
  filter: (object, client) => {
    let valid = false;
    if (object._id === client.hospitalId) valid = true;
    return valid;
  },
  onChange: ({ action, record }, db, queueManager) => {
    let { objectsFullySynced } = record;
    let newItems = [];
    if (objectsFullySynced != '') {
      objectsFullySynced = JSON.parse(objectsFullySynced) || {};
      if (has(objectsFullySynced, 'new')) newItems = objectsFullySynced['new'];
      if (!isEmpty(newItems)) {
        newItems.forEach((item) => {
          queueManager.push({
            action: 'SAVE',
            recordId: item._id,
            recordType: item.recordType
          });
        });

        delete objectsFullySynced['new'];
        db.write(() => {
          record.objectsFullySynced = JSON.stringify(objectsFullySynced);
        });
      }
    }
  }
};

module.exports = HospitalSchema;
