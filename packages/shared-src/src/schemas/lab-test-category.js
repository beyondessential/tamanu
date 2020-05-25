import defaults from './defaults';

export const TestCategorySchema = {
  name: 'labTestCategory',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: 'string',
    ...defaults,
  },
};
