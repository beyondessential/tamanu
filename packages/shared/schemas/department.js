import defaults from './defaults';

export const DepartmentSchema = {
  name: 'department',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: 'string',

    ...defaults,
  },
};
