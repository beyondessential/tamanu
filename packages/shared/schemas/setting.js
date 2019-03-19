const { SYNC_MODES } = require('../constants');
const defaults = require('./defaults');

const SettingSchema = {
  name: 'setting',
  primaryKey: 'key',
  sync: SYNC_MODES.OFF,
  properties: {
    key: {
      type: 'string',
      indexed: true,
    },
    value: {
      type: 'string',
      optional: true,
    },
    ...defaults,
  },
};

module.exports = SettingSchema;
