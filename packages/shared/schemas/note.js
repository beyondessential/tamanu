import defaults from './defaults';

export const NoteSchema = {
  name: 'note',
  primaryKey: '_id',
  properties: {
    _id: 'string',

    author: 'user',
    type: 'string',
    content: 'string',
    priority: { type: 'bool', default: false },
    date: { type: 'date', default: new Date(), },
    
    ...defaults,
  },
};
