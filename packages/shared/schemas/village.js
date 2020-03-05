import defaults from './defaults';

export const VillageSchema = {
  name: 'village',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      indexed: true,
    },
    ...defaults,
  },
};
