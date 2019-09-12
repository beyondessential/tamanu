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

    note: 'string',

    // reverse links
    patient: { type: 'linkingObjects', objectType: 'patient', property: 'triages' },

    ...defaults,
  },
};
