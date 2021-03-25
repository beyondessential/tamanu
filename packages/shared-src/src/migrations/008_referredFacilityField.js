"use strict";

const Sequelize = require('sequelize');
import { DIAGNOSIS_CERTAINTY, DIAGNOSIS_CERTAINTY_VALUES } from 'shared/constants';

module.exports = {
  up: async query => {
    await query.renameColumn('referrals', 'referredFacility', 'referred_facility');
  },
  down: async query => {
    await query.renameColumn('referrals', 'referred_facility', 'referredFacility');
  }
};