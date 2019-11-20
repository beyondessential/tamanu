import defaults from './defaults';

export const TriageSchema = {
  name: 'triage',
  primaryKey: '_id',
  properties: {
    _id: 'string',

    arrivalTime: 'date',
    triageTime: 'date',
    closedTime: 'date?',

    visit: 'visit',
    location: 'location',
    practitioner: 'user?',

    chiefComplaint: 'diagnosis',
    secondaryComplaint: 'diagnosis?',

    score: 'string',
    notes: { type: 'string', default: '' },

    // reverse links
    patient: { type: 'linkingObjects', objectType: 'patient', property: 'triages' },

    ...defaults,
  },
};
