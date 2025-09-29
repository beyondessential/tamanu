export const SETTING_KEYS = {
  VACCINATION_DEFAULTS: 'vaccinations.defaults',
  VACCINATION_GIVEN_ELSEWHERE_DEFAULTS: 'vaccinations.givenElsewhere.defaults',
  TEMPLATES_LETTERHEAD: 'templates.letterhead',
  FEATURES_REMINDER_CONTACT_ENABLED: 'features.reminderContactModule.enabled',
  FEATURE_MANDATE_SPECIMEN_TYPE: 'features.mandateSpecimenType',
  SLIDING_FEE_SCALE: 'invoice.slidingFeeScale',
  CUSTOMISATIONS_COMPONENTS: 'customisations.componentVersions',
  SYNC_ALL_LAB_REQUESTS: 'sync.syncAllLabRequests',
  SYNC_URGENT_INTERVAL_IN_SECONDS: 'sync.urgentIntervalInSeconds',
  INTEGRATIONS_IMAGING: 'integrations.imaging',
  FEATURES_DEVICE_REGISTRATION_QUOTA_ENABLED: 'features.deviceRegistrationQuota.enabled',
  FEATURES_DESKTOP_CHARTING_ENABLED: 'features.desktopCharting.enabled',
  FEATURES_MANDATORY_CHARTING_EDIT_REASON: 'features.mandatoryChartingEditReason',
  FEATURES_ENABLE_CHARTING_EDIT: 'features.enableChartingEdit',
  FEATURES_MANDATORY_VITAL_EDIT_REASON: 'features.mandatoryVitalEditReason',
  FEATURES_ENABLE_VITAL_EDIT: 'features.enableVitalEdit',
  VITAL_EDIT_REASONS: 'vitalEditReasons',
  FILE_CHOOSER_MB_SIZE_LIMIT: 'fileChooserMbSizeLimit',
};

export const SETTINGS_SCOPES = {
  CENTRAL: 'central',
  GLOBAL: 'global',
  FACILITY: 'facility',
} as const;
