import defaults from './defaults';

export const FamilyHistorySchema = {
  name: 'familyHistoryItem',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date',
    notes: 'string',
    practitioner: 'user',
    diagnosis: 'diagnosis',

    ...defaults,
  },
};
