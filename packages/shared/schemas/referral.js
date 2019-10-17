import defaults from './defaults';

export const ReferralSchema = {
  name: 'referral',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date',
    certainty: 'string', // suspected or confirmed
    urgent: { type: 'bool', default: false },
    notes: { type: 'string', default: '' },

    closedDate: 'date?',

    // has-one
    referringDoctor: 'user?',
    diagnosis: 'diagnosis?',
    visit: 'visit?',

    facility: 'hospital?',
    department: 'department?',

    // reverse links
    patient: { type: 'linkingObjects', objectType: 'patient', property: 'referrals' },

    ...defaults,
  },
};
