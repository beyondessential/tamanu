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
  'public.sync_lookup_ticks',
  'public.sync_lookup',
  'public.sync_queued_devices',
  'public.sync_sessions',
  'public.user_localisation_caches',
  'public.user_recently_viewed_patients',
];

export const NON_LOGGED_TABLES = [
  'logs.changes',
  'logs.debug_logs',
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

  // internal and also signers.privateKey needs to be hard-deletable
  'public.signers',

  // internal configuration
  'public.local_system_facts',
];
