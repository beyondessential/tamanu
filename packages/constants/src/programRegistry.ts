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

export const CONDITION_CATEGORIES = {
  SUSPECTED: 'Suspected',
  UNDER_INVESTIGATION: 'Under investigation',
  CONFIRMED: 'Confirmed',
  UNKNOWN: 'Unknown',
  DISPROVEN: 'Disproven',
  RESOLVED: 'Resolved',
  IN_REMISSION: 'In remission',
  NOT_APPLICABLE: 'Not applicable',
  RECORDED_IN_ERROR: 'Recorded in error',
};
