import defaults from './defaults';

export const TriageSchema = {
  name: 'triage',
  primaryKey: '_id',
  properties: {
    _id: 'string',

    arrivalTime: 'date',
    triageTime: 'date',

    location: 'location?',
    practitioner: 'user?',

    score: 'string',
    status: { type: 'string', default: 'waiting' },
    note: { type: 'string', default: '' },

    // reverse links
    patient: { type: 'linkingObjects', objectType: 'patient', property: 'triages' },

    ...defaults,
  },
};
