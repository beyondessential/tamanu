export const NON_SYNCING_TABLES = [
  'logs.debug_logs',
  'logs.fhir_writes',
  'public.fhir_materialise_jobs',
  'public.local_system_facts',
  'public.one_time_logins',
  'public.patient_vrs_data',
  'public.refresh_tokens',
  'public.SequelizeMeta',
  'public.signers',
  'public.sync_device_ticks',
  'public.sync_lookup',
  'public.sync_queued_devices',
  'public.sync_sessions',
  'public.user_localisation_caches',
  'public.user_recently_viewed_patients',
];

export const NON_LOGGED_TABLES = [
  // logs
  'logs.*',

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
