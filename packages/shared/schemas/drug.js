import defaults from './defaults';

export const DrugSchema = {
  name: 'drug',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: {
      type: 'string',
      optional: true,
      indexed: true,
    },
    code: {
      type: 'string',
      optional: true,
      indexed: true,
    },
    unit: {
      type: 'string',
      optional: true,
    },
    ...defaults,
  },
};
