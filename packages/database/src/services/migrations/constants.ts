export const GLOBAL_EXCLUDE_TABLES = [
  // internal migration tables
  'public.SequelizeMeta',
];

export const NON_SYNCING_TABLES = [
  'logs.debug_logs',
  'logs.dhis2_pushes',
  'logs.fhir_writes',
  'public.devices',
  'public.fhir_materialise_jobs',
  'public.local_system_facts',
  'public.one_time_logins',
  'public.patient_vrs_data',
  'public.refresh_tokens',
  'public.signers_historical',
  'public.sync_device_ticks',
  'public.sync_lookup',
  'public.sync_lookup_ticks',
  'public.sync_queued_devices',
  'public.sync_sessions',
  'public.user_localisation_caches',
  'public.user_recently_viewed_patients',
  'public.portal_one_time_tokens',
];

export const NON_LOGGED_TABLES = [
  // logs
  'logs.*',

  // internal authentication tables
  'public.one_time_logins',
  'public.refresh_tokens',

  // internal sync tables
  'public.sync_sessions',
  'public.sync_queued_devices',
  'public.sync_lookup',
  'public.sync_device_ticks',
  'public.sync_lookup_ticks',

  // caches
  'public.user_localisation_caches',
  'public.user_recently_viewed_patients',
  'public.fhir_materialise_jobs',
  'public.patient_vrs_data',

  // historical signer records retained for compliance, no sensitive data remains
  'public.signers_historical',

  // internal configuration
  'public.local_system_facts',
];
