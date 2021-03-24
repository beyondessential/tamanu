"use strict";

const Sequelize = require('sequelize');
import { DIAGNOSIS_CERTAINTY, DIAGNOSIS_CERTAINTY_VALUES } from 'shared/constants';

module.exports = {
  up: async query => {
    // remove old cols
    await query.removeColumn('referral', 'referral_number');
    await query.removeColumn('referral', 'reason_for_referral');
    await query.removeColumn('referral', 'cancelled');
    await query.removeColumn('referral', 'urgent');
    await query.removeColumn('referral', 'date');
    await query.removeColumn('referral', 'encounter_id');
    await query.removeColumn('referral', 'patient_id');
    await query.removeColumn('referral', 'referred_by_id');
    await query.removeColumn('referral', 'referred_to_department_id');
    await query.removeColumn('referral', 'referred_to_facility_id');

    // add new cols
    await query.addColumn('referral', 'referredFacility', Sequelize.STRING);
    await query.addColumn('referral', 'initiating_encounter_id', {
      type: Sequelize.STRING,
      references: {
        model: 'encounter',
        key: 'id'
      }
    });
    await query.addColumn('referral', 'completing_encounter_id', {
      type: Sequelize.STRING,
      references: {
        model: 'encounter',
        key: 'id'
      }
    });
    await query.addColumn('referral', 'survey_response_id', {
      type: Sequelize.STRING,
      references: {
        model: 'survey_response',
        key: 'id'
      }
    });

    // remove unused table
    await query.dropTable('referral_diagnoses');
  },
  down: async query => {
    await query.addColumn('referral', 'referral_number', Sequelize.STRING);
    await query.addColumn('referral', 'reason_for_referral', Sequelize.STRING);
    await query.addColumn('referral', 'cancelled', Sequelize.BOOLEAN);
    await query.addColumn('referral', 'urgent', Sequelize.BOOLEAN);
    await query.addColumn('referral', 'date', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    });
    await query.addColumn('referral', 'encounter_id', {
      type: Sequelize.STRING,
      references: {
        model: 'encounter',
        key: 'id'
      }
    });
    await query.addColumn('referral', 'patient_id', {
      type: Sequelize.STRING,
      references: {
        model: 'patient',
        key: 'id'
      }
    });
    await query.addColumn('referral', 'referred_by_id', {
      type: Sequelize.STRING,
      references: {
        model: 'user',
        key: 'id'
      }
    });
    await query.addColumn('referral', 'referred_to_department_id', {
      type: Sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id'
      }
    });
    await query.addColumn('referral', 'referred_to_facility_id', {
      type: Sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id'
      }
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
        key: 'id'
      }
    });
    await query.addColumn('referral_diagnoses', 'diagnosis_id', {
      type: Sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id'
      }
    });
  }
};