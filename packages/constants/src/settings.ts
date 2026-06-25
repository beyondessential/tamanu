export const SETTING_KEYS = {
  VACCINATION_DEFAULTS: 'vaccinations.defaults',
  VACCINATION_GIVEN_ELSEWHERE_DEFAULTS: 'vaccinations.givenElsewhere.defaults',
  TEMPLATES_LETTERHEAD: 'templates.letterhead',
  FEATURES_REMINDER_CONTACT_ENABLED: 'features.reminderContactModule.enabled',
  FEATURE_MANDATE_SPECIMEN_TYPE: 'features.mandateSpecimenType',
  SLIDING_FEE_SCALE: 'invoice.slidingFeeScale',
  INSURER_DEFAULT_CONTRIBUTION: 'insurer.defaultContribution',
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
  SECURITY_LOGIN_ATTEMPTS: 'security.loginAttempts',
  SECURITY_MOBILE_ALLOW_UNENCRYPTED_STORAGE: 'security.mobile.allowUnencryptedStorage',
  SECURITY_MOBILE_ALLOW_UNPROTECTED: 'security.mobile.allowUnprotected',
};

export const SETTINGS_SCOPES = {
  CENTRAL: 'central',
  GLOBAL: 'global',
  FACILITY: 'facility',
} as const;

export const SETTING_EDITORS = {
  MULTILINE: 'multiline',
  MARKDOWN: 'markdown',
} as const;

export type SettingEditor = (typeof SETTING_EDITORS)[keyof typeof SETTING_EDITORS];

// Which browser families may load the web app, in increasing permissiveness.
export const BROWSER_SUPPORT_POLICIES = {
  // Identifies as Chrome, Chromium or Edge only.
  CHROMIUM: 'chromium',
  // Any Blink-engine browser (also Opera, Vivaldi, Brave, Yandex, Arc, ...).
  BLINK: 'blink',
  // Any browser, including Firefox and Safari (experimental, caveat emptor).
  ALL: 'all',
} as const;

export type BrowserSupportPolicy =
  (typeof BROWSER_SUPPORT_POLICIES)[keyof typeof BROWSER_SUPPORT_POLICIES];

// Which device types may load the web app, in increasing permissiveness.
export const PLATFORM_SUPPORT_POLICIES = {
  // Desktops and laptops only.
  DESKTOP: 'desktop',
  // Desktops, laptops and tablets.
  TABLET: 'tablet',
  // Any device, including mobile phones.
  ALL: 'all',
} as const;

export type PlatformSupportPolicy =
  (typeof PLATFORM_SUPPORT_POLICIES)[keyof typeof PLATFORM_SUPPORT_POLICIES];
