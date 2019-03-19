const { SYNC_MODES } = require('../constants');

export const ChangeSchema = {
  name: 'change',
  primaryKey: '_id',
  sync: SYNC_MODES.OFF,
  properties: {
    _id: 'string',
    action: 'string',
    recordId: 'string',
    recordType: 'string',
    timestamp: 'int',
  },
};
