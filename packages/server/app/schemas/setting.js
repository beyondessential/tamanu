const SettingSchema = {
  name: 'setting',
  primaryKey: 'key',
  sync: false,
  properties: {
    key: 'string',
    value: {
      type: 'string',
      optional: true
    },
  },
};

module.exports = SettingSchema;
