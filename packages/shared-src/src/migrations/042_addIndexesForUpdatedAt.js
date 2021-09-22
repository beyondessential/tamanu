const ALL_TABLES = [
  'administered_vaccines',
  'appointments',
  'assets',
  'attachments',
  'channel_sync_pull_cursors',
  'discharges',
  'encounter_diagnoses',
  'encounter_medications',
  'encounters',
  'imaging_requests',
  'lab_request_logs',
  'lab_requests',
  'lab_test_types',
  'lab_tests',
  'local_system_facts',
  'locations',
  'notes',
  'one_time_logins',
  'patient_additional_data',
  'patient_allergies',
  'patient_care_plans',
  'patient_communications',
  'patient_conditions',
  'patient_family_histories',
  'patient_issues',
  'patients',
  'procedures',
  'program_data_elements',
  'programs',
  'reference_data',
  'referrals',
  'report_requests',
  'scheduled_vaccines',
  'settings',
  'survey_response_answers',
  'survey_responses',
  'survey_screen_components',
  'surveys',
  'triages',
  'user_facilities',
  'user_localisation_caches',
  'users',
  'vitals',
];

const PATIENT_NESTED_TABLES = [
  'encounters',
  'patient_additional_data',
  'patient_allergies',
  'patient_care_plans',
  'patient_communications',
  'patient_conditions',
  'patient_family_histories',
  'patient_issues',
];

module.exports = {
  up: async query => {
    for (const table of PATIENT_NESTED_TABLES) {
      await query.addIndex(table, {
        fields: ['patient_id'],
      });
    }
    for (const table of ALL_TABLES) {
      await query.addIndex(table, {
        fields: ['updated_at'],
      });
    }
  },
  down: async query => {
    for (const table of PATIENT_NESTED_TABLES) {
      await query.removeIndex(table, {
        fields: ['patient_id'],
      });
    }
    for (const table of ALL_TABLES) {
      await query.removeIndex(table, {
        fields: ['updated_at'],
      });
    }
  },
};
