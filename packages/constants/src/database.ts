// can't use kebab here as pg doesn't accept kebab
export const NOTIFY_CHANNELS = {
  MATERIALIZED_VIEW_REFRESHED: 'materialized_view_refreshed',
  TABLE_CHANGED: 'table_changed',
};

// Session config keys are prefixed with this to avoid conflicts with other settings
export const SESSION_CONFIG_PREFIX = 'tamanu.'

// Audit session config keys
export const AUDIT_USERID_KEY = 'audit.userid';
export const AUDIT_ENDPOINT_KEY = 'audit.endpoint';
export const AUDIT_PAUSE_KEY = 'audit.pause';
export const AUDIT_REASON_KEY = 'audit.reason';
export const AUDIT_MIGRATION_CONTEXT_KEY = 'audit.migration_context';
