export const VACCINE_CATEGORIES = {
  ROUTINE: 'Routine',
  CATCHUP: 'Catchup',
  CAMPAIGN: 'Campaign',
  OTHER: 'Other',
};

export const VACCINE_CATEGORY_LABELS = {
  [VACCINE_CATEGORIES.ROUTINE]: 'Routine',
  [VACCINE_CATEGORIES.CATCHUP]: 'Catch-up',
  [VACCINE_CATEGORIES.CAMPAIGN]: 'Campaign',
  [VACCINE_CATEGORIES.OTHER]: 'Other',
};

export const VACCINE_CATEGORY_OPTIONS = [
  { value: VACCINE_CATEGORIES.ROUTINE, label: VACCINE_CATEGORY_LABELS[VACCINE_CATEGORIES.ROUTINE] },
  { value: VACCINE_CATEGORIES.CATCHUP, label: VACCINE_CATEGORY_LABELS[VACCINE_CATEGORIES.CATCHUP] },
  {
    value: VACCINE_CATEGORIES.CAMPAIGN,
    label: VACCINE_CATEGORY_LABELS[VACCINE_CATEGORIES.CAMPAIGN],
  },
  { value: VACCINE_CATEGORIES.OTHER, label: VACCINE_CATEGORY_LABELS[VACCINE_CATEGORIES.OTHER] },
];

export const VACCINE_CATEGORIES_VALUES = Object.values(VACCINE_CATEGORIES);

export const INJECTION_SITE_VALUES = {
  LEFT_ARM: 'left_arm',
  RIGHT_ARM: 'right_arm',
  LEFT_THIGH: 'left_thigh',
  RIGHT_THIGH: 'right_thigh',
  ORAL: 'oral',
  OTHER: 'other',
};

export const INJECTION_SITE_LABELS = {
  [INJECTION_SITE_VALUES.LEFT_ARM]: 'Left arm',
  [INJECTION_SITE_VALUES.RIGHT_ARM]: 'Right arm',
  [INJECTION_SITE_VALUES.LEFT_THIGH]: 'Left thigh',
  [INJECTION_SITE_VALUES.RIGHT_THIGH]: 'Right thigh',
  [INJECTION_SITE_VALUES.ORAL]: 'Oral',
  [INJECTION_SITE_VALUES.OTHER]: 'Other',
};

export const INJECTION_SITE_OPTIONS = {
  [INJECTION_SITE_VALUES.LEFT_ARM]: INJECTION_SITE_LABELS[INJECTION_SITE_VALUES.LEFT_ARM],
  [INJECTION_SITE_VALUES.RIGHT_ARM]: INJECTION_SITE_LABELS[INJECTION_SITE_VALUES.RIGHT_ARM],
  [INJECTION_SITE_VALUES.LEFT_THIGH]: INJECTION_SITE_LABELS[INJECTION_SITE_VALUES.LEFT_THIGH],
  [INJECTION_SITE_VALUES.RIGHT_THIGH]: INJECTION_SITE_LABELS[INJECTION_SITE_VALUES.RIGHT_THIGH],
  [INJECTION_SITE_VALUES.ORAL]: INJECTION_SITE_LABELS[INJECTION_SITE_VALUES.ORAL],
  [INJECTION_SITE_VALUES.OTHER]: INJECTION_SITE_LABELS[INJECTION_SITE_VALUES.OTHER],
};

export const ICAO_DOCUMENT_TYPES = {
  PROOF_OF_TESTING: {
    DOCTYPE: 'NT',
    JSON: 'icao.test',
  },
  PROOF_OF_VACCINATION: {
    DOCTYPE: 'NV',
    JSON: 'icao.vacc',
  },
};

export const COVID_19_CLEARANCE_CERTIFICATE = 'covid_19_clearance';

export const VACCINATION_CERTIFICATE = 'vaccination_certificate';

export const EUDCC_CERTIFICATE_TYPES = {
  VACCINATION: 'v',
  TEST: 't',
  RECOVERY: 'r',
};

export const EUDCC_SCHEMA_VERSION = '1.3.0';

export const X502_OIDS = {
  COMMON_NAME: '2.5.4.3',
  COUNTRY_NAME: '2.5.4.6',
  BASIC_CONSTRAINTS: '2.5.29.19',
  KEY_USAGE: '2.5.29.15',
  PRIVATE_KEY_USAGE_PERIOD: '2.5.29.16', // "PKUP"
  EXTENDED_KEY_USAGE: '2.5.29.37', // "EKU"
  KEY_IDENTIFIER: '2.5.29.14', // "SKI"
  AUTHORITY_KEY_IDENTIFIER: '2.5.29.35', // "AKI"
  DOCUMENT_TYPE: '2.23.136.1.1.6.2',
  EKU_VDS_NC: '2.23.136.1.1.14.2',
  EKU_EU_DCC_TEST: '1.3.6.1.4.1.1847.2021.1.1',
  EKU_EU_DCC_VACCINATION: '1.3.6.1.4.1.1847.2021.1.2',
  EKU_EU_DCC_RECOVERY: '1.3.6.1.4.1.1847.2021.1.3',
};

export const CERTIFICATE_NOTIFICATION_STATUSES = {
  QUEUED: 'Queued',
  PROCESSED: 'Processed',
  ERROR: 'Error',
  IGNORE: 'Ignore',
};

export const VACCINE_STATUS = {
  UNKNOWN: 'UNKNOWN',
  GIVEN: 'GIVEN',
  NOT_GIVEN: 'NOT_GIVEN',
  SCHEDULED: 'SCHEDULED',
  MISSED: 'MISSED',
  DUE: 'DUE',
  UPCOMING: 'UPCOMING',
  OVERDUE: 'OVERDUE',
  RECORDED_IN_ERROR: 'RECORDED_IN_ERROR',
  HISTORICAL: 'HISTORICAL',
};

export const VACCINE_STATUS_LABELS = {
  [VACCINE_STATUS.UNKNOWN]: 'Unknown',
  [VACCINE_STATUS.GIVEN]: 'Given',
  [VACCINE_STATUS.NOT_GIVEN]: 'Not given',
  [VACCINE_STATUS.SCHEDULED]: 'Scheduled',
  [VACCINE_STATUS.MISSED]: 'Missed',
  [VACCINE_STATUS.DUE]: 'Due',
  [VACCINE_STATUS.UPCOMING]: 'Upcoming',
  [VACCINE_STATUS.OVERDUE]: 'Overdue',
  [VACCINE_STATUS.RECORDED_IN_ERROR]: 'Recorded in error',
  [VACCINE_STATUS.HISTORICAL]: 'Historical',
};

export const VACCINE_RECORDING_TYPES = {
  GIVEN: VACCINE_STATUS.GIVEN,
  NOT_GIVEN: VACCINE_STATUS.NOT_GIVEN,
};
