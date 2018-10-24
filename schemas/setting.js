const defaults = require('./defaults');

const SettingSchema = {
  name: 'setting',
  primaryKey: 'key',
  sync: false,
  properties: Object.assign({
    key: 'string',
    value: {
      type: 'string',
      optional: true
    },
  }, defaults)
};

module.exports = SettingSchema;
