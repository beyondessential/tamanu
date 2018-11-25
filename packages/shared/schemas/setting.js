const defaults = require('./defaults');

const SettingSchema = {
  name: 'setting',
  primaryKey: 'key',
  sync: false,
  properties: Object.assign({
    key: {
      type: 'string',
      indexed: true
    },
    value: {
      type: 'string',
      optional: true
    },
  }, defaults)
};

module.exports = SettingSchema;
