import defaults from './defaults';

export const ConditionsSchema = {
  name: 'condition',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date',
    condition: 'diagnosis',
    notes: 'string?',
    resolved: { type: 'bool', default: false },
    ...defaults,
  },
};
