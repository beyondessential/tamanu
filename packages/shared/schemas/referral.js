import defaults from './defaults';

export const ReferralSchema = {
  name: 'referral',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    date: 'date',
    certainty: 'string', // suspected or confirmed
    urgent: 'bool',
    notes: 'string',

    // has-one
    referringDoctor: { type: 'user', optional: true },
    diagnosis: { type: 'diagnosis', optional: true },

    // referredFacility: ????
    // department: ????

    // reverse links
    patient: { type: 'linkingObjects', objectType: 'patient', property: 'referrals' },

    ...defaults,
  },
};
