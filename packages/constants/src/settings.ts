export const SETTING_KEYS = {
  VACCINATION_DEFAULTS: 'vaccinations.defaults',
  VACCINATION_GIVEN_ELSEWHERE_DEFAULTS: 'vaccinations.givenElsewhere.defaults',
  TEMPLATES_LETTERHEAD: 'templates.letterhead',
  FEATURES_REMINDER_CONTACT_ENABLED: 'features.reminderContactModule.enabled',
  FEATURE_MANDATE_SPECIMEN_TYPE: 'features.mandateSpecimenType',
  SLIDING_FEE_SCALE: 'invoice.slidingFeeScale',
  INSURER_DEFAUlT_CONTRIBUTION: 'insurer.defaultContribution',
  CUSTOMISATIONS_COMPONENTS: 'customisations.componentVersions',
  SYNC_ALL_LAB_REQUESTS: 'sync.syncAllLabRequests',
  SYNC_URGENT_INTERVAL_IN_SECONDS: 'sync.urgentIntervalInSeconds',
  INTEGRATIONS_IMAGING: 'integrations.imaging',
  FEATURES_DESKTOP_CHARTING_ENABLED: 'features.desktopCharting.enabled',
  FILE_CHOOSER_MB_SIZE_LIMIT: 'fileChooserMbSizeLimit',
};

export const SETTINGS_SCOPES = {
  CENTRAL: 'central',
  GLOBAL: 'global',
  FACILITY: 'facility',
} as const;
