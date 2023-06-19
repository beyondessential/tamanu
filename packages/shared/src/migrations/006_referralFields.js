const Sequelize = require('sequelize');

const DIAGNOSIS_CERTAINTY = {
  SUSPECTED: 'suspected',
  CONFIRMED: 'confirmed',
};
const DIAGNOSIS_CERTAINTY_VALUES = Object.values(DIAGNOSIS_CERTAINTY);

module.exports = {
  up: async query => {
    // remove old cols
    await query.removeColumn('referrals', 'referral_number');
    await query.removeColumn('referrals', 'reason_for_referral');
    await query.removeColumn('referrals', 'cancelled');
    await query.removeColumn('referrals', 'urgent');
    await query.removeColumn('referrals', 'date');
    await query.removeColumn('referrals', 'encounter_id');
    await query.removeColumn('referrals', 'patient_id');
    await query.removeColumn('referrals', 'referred_by_id');
    await query.removeColumn('referrals', 'referred_to_department_id');
    await query.removeColumn('referrals', 'referred_to_facility_id');

    // add new cols
    await query.addColumn('referrals', 'referredFacility', Sequelize.STRING);
    await query.addColumn('referrals', 'initiating_encounter_id', {
      type: Sequelize.STRING,
      references: {
        model: 'encounters',
        key: 'id',
      },
    });
    await query.addColumn('referrals', 'completing_encounter_id', {
      type: Sequelize.STRING,
      references: {
        model: 'encounters',
        key: 'id',
      },
    });
    await query.addColumn('referrals', 'survey_response_id', {
      type: Sequelize.STRING,
      references: {
        model: 'survey_responses',
        key: 'id',
      },
    });

    // remove unused table
    await query.dropTable('referral_diagnoses');
  },
  down: async query => {
    await query.addColumn('referrals', 'referral_number', Sequelize.STRING);
    await query.addColumn('referrals', 'reason_for_referral', Sequelize.STRING);
    await query.addColumn('referrals', 'cancelled', Sequelize.BOOLEAN);
    await query.addColumn('referrals', 'urgent', Sequelize.BOOLEAN);
    await query.addColumn('referrals', 'date', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    });
    await query.addColumn('referrals', 'encounter_id', {
      type: Sequelize.STRING,
      references: {
        model: 'encounter',
        key: 'id',
      },
    });
    await query.addColumn('referrals', 'patient_id', {
      type: Sequelize.STRING,
      references: {
        model: 'patient',
        key: 'id',
      },
    });
    await query.addColumn('referrals', 'referred_by_id', {
      type: Sequelize.STRING,
      references: {
        model: 'user',
        key: 'id',
      },
    });
    await query.addColumn('referrals', 'referred_to_department_id', {
      type: Sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    });
    await query.addColumn('referrals', 'referred_to_facility_id', {
      type: Sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    });
    await query.createTable('referral_diagnoses');
    await query.addColumn('referral_diagnoses', 'certainty', {
      type: Sequelize.ENUM(DIAGNOSIS_CERTAINTY_VALUES),
      defaultValue: DIAGNOSIS_CERTAINTY.SUSPECTED,
    });
    await query.addColumn('referral_diagnoses', 'referral_id', {
      type: Sequelize.STRING,
      references: {
        model: 'referral',
        key: 'id',
      },
    });
    await query.addColumn('referral_diagnoses', 'diagnosis_id', {
      type: Sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    });
  },
};
