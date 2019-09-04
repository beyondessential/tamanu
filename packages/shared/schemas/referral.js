import defaults from './defaults';

export const ReferralSchema = {
  name: 'referral',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date',
    certainty: 'string', // suspected or confirmed
    urgent: { type: 'bool', default: false },
    notes: { type: 'string', optional: true },

    status: 'string',
    closedDate: { type: 'date', optional: true },

    // has-one
    referringDoctor: { type: 'user', optional: true },
    diagnosis: { type: 'diagnosis', optional: true },

    facility: 'hospital?',
    location: 'location?',

    // reverse links
    patient: { type: 'linkingObjects', objectType: 'patient', property: 'referrals' },

    ...defaults,
  },
};
