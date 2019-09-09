import defaults from './defaults';

export const TriageSchema = {
  name: 'triage',
  primaryKey: '_id',
  properties: {
    _id: 'string',

    patient: 'patient',
    arrivalTime: 'date',
    triageTime: 'date',

    location: 'location?',
    practitioner: 'user?',

    referredFrom: 'string?',
    reasonForVisit: 'string',

    score: 'int',

    notes: 'string',

    ...defaults,
  },
};
