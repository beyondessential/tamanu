import defaults from './defaults';
import { SYNC_MODES } from '../constants';

export const SettingSchema = {
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
