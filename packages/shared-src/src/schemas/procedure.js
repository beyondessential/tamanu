import defaults from './defaults';

export const ProcedureSchema = {
  name: 'procedure',
  primaryKey: '_id',
  properties: {
    _id: 'string',

    type: 'procedureType',
    location: 'location',
    date: 'date',
    startTime: 'date',
    endTime: 'date?',
    physician: 'user',
    assistant: 'user?',
    anaesthetist: 'user?',
    anaesthesiaType: 'drug?',
    notes: { type: 'string', default: '' },
    completed: { type: 'bool', default: false },
    completedNotes: { type: 'string', default: '' },

    ...defaults,
  },
};
