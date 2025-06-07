import { COLORS } from './colors.js';

export const CURRENTLY_AT_TYPES = {
  VILLAGE: 'village',
  FACILITY: 'facility',
};

export const REGISTRATION_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  RECORDED_IN_ERROR: 'recordedInError',
};

// Please keep in sync with packages/mobile/App/constants/programRegistries.ts
export const PROGRAM_REGISTRATION_STATUS_LABELS = {
  [REGISTRATION_STATUSES.ACTIVE]: 'Active',
  [REGISTRATION_STATUSES.INACTIVE]: 'Removed',
  [REGISTRATION_STATUSES.RECORDED_IN_ERROR]: 'Delete',
};

export const STATUS_COLOR = {
  purple: COLORS.purple,
  pink: COLORS.pink,
  orange: COLORS.darkOrange,
  yellow: COLORS.metallicYellow,
  blue: COLORS.blue,
  green: COLORS.green,
  grey: COLORS.grey,
  red: COLORS.red,
  brown: '#7A492E',
  teal: '#125E7E',
};

/**
 * ########################################################################################################
 *       These categories must be kept in sync with the ones in @tamanu/mobile/constants/programRegistries
 * ########################################################################################################
 */
export const PROGRAM_REGISTRY_CONDITION_CATEGORIES = {
  UNKNOWN: 'unknown',
  DISPROVEN: 'disproven',
  RESOLVED: 'resolved',
  RECORDED_IN_ERROR: 'recordedInError',
};

export const PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS = {
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN]: 'Unknown',
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.DISPROVEN]: 'Disproven',
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.RESOLVED]: 'Resolved',
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR]: 'Recorded in error',
};

// ########################################################################################################
