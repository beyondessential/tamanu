import defaults from './defaults';
import { SYNC_MODES } from '../constants';

export const ClientSchema = {
  name: 'client',
  primaryKey: 'clientId',
  sync: SYNC_MODES.OFF,
  properties: {
    _id: 'string',
    userId: 'string',
    hospitalId: 'string',
    clientId: 'string',
    clientSecret: 'string',
    lastActive: {
      type: 'int',
      default: 0,
    },
    expiry: {
      type: 'int',
      default: 0,
    },
    syncOut: {
      type: 'int',
      default: 0,
    },
    date: {
      type: 'date',
      default: new Date(),
    },
    ...defaults,
  },
};
