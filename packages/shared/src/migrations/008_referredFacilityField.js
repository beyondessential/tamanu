module.exports = {
  up: async query => {
    await query.renameColumn('referrals', 'referredFacility', 'referred_facility');
  },
  down: async query => {
    await query.renameColumn('referrals', 'referred_facility', 'referredFacility');
  },
};
