import defaults from './defaults';

export const IssueSchema = {
  name: 'issue',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    type: 'string',
    date: 'date',
    notes: 'string',
    ...defaults,
  },
};
