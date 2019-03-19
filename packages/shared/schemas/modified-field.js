import { SYNC_MODES } from '../constants';

export const modifiedFieldSchema = {
  name: 'modifiedField',
  primaryKey: '_id',
  sync: SYNC_MODES.LOCAL_TO_REMOTE,
  properties: {
    _id: 'string',
    token: 'string',
    field: 'string',
    time: {
      type: 'int',
      default: new Date().getTime(),
    },
  },
};
