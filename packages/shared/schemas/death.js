import defaults from './defaults';

export const DeathSchema = {
  name: 'death',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date',
    primaryCause: 'diagnosis',
    physician: 'user',

    ...defaults,
  },
};
