export const NON_SYNCING_TABLES = [
  'local_system_facts',
  'one_time_logins',
  'refresh_tokens',
  'patient_vrs_data',
  'SequelizeMeta',
  'signers',
  'sync_sessions',
  'sync_queued_devices',
  'user_localisation_caches',
  'fhir_materialise_jobs',
  'jobs',
  'job_workers',
  'user_recently_viewed_patients',
  'sync_lookup',
  'debug_logs',
  'sync_device_ticks',
];

export const NON_LOGGED_TABLES = [
  // internal authentication tables
  'one_time_logins',
  'refresh_tokens',

  // internal sync tables
  'sync_sessions',
  'sync_queued_devices',
  'sync_lookup',
  'sync_device_ticks',

  // caches
  'user_localisation_caches',
  'user_recently_viewed_patients',
  'fhir_materialise_jobs',
  'patient_vrs_data',

  // internal and also signers.privateKey needs to be hard-deletable
  'signers',

  // internal configuration
  'local_system_facts',
];
