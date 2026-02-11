export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'apiToken',
  LOCALISATION: 'localisation',
  SERVER: 'server',
  AVAILABLE_FACILITIES: 'availableFacilities',
  FACILITY_ID: 'facilityId',
  GLOBAL_TIME_ZONE: 'globalTimeZone',
  REMEMBER_EMAIL: 'remember-email',
  PERMISSIONS: 'permissions',
  ROLE: 'role',
  LANGUAGE: 'language',
  SETTINGS: 'settings',
};

export const ALPHABET_FOR_ID =
  // this is absolutely fine and the concat isn't useless
  // eslint-disable-next-line no-useless-concat
  'ABCDEFGH' + /* I */ 'JK' + /* L */ 'MN' + /* O */ 'PQRSTUVWXYZ' + /* 01 */ '23456789';

export const REQUIRED_INLINE_ERROR_MESSAGE = '*Required';
