export const GLOBAL_EXCLUDE_TABLES = [
  // internal migration tables
  'public.SequelizeMeta',
];

export const NON_SYNCING_TABLES = [
  'logs.debug_logs',
  'logs.dhis2_pushes',
  'logs.m_supply_pushes',
  'logs.fhir_writes',
  'public.ai_chat_sessions',
  'public.devices',
  'public.fhir_materialise_jobs',
  'public.form_builder_chat_jobs',
  'public.local_system_facts',
  'public.mfa_challenges',
  'public.one_time_logins',
  'public.patient_vrs_data',
  'public.refresh_tokens',
  'public.signers_historical',
  'public.sync_device_ticks',
  'public.sync_lookup',
  'public.sync_lookup_ticks',
  'public.sync_queued_devices',
  'public.sync_sessions',
  'public.totp_secrets',
  'public.user_localisation_caches',
  'public.user_recently_viewed_patients',
  'public.portal_one_time_tokens',
];

export const NON_LOGGED_TABLES = [
  // logs
  'logs.*',

  // internal authentication tables
  'public.mfa_challenges',
  'public.one_time_logins',
  'public.refresh_tokens',
  'public.totp_secrets',

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

  // ephemeral AI form-builder chat state
  'public.ai_chat_sessions',
  'public.form_builder_chat_jobs',

  // historical signer records retained for compliance, no sensitive data remains
  'public.signers_historical',

  // internal configuration
  'public.local_system_facts',
];
