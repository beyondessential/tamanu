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

export const PROGRAM_REGISTRY_CONDITION_CATEGORIES = {
  Suspected: 'Suspected',
  'Under investigation': 'Under investigation',
  Confirmed: 'Confirmed',
  Unknown: 'Unknown',
  Disproven: 'Disproven',
  Resolved: 'Resolved',
  'In remission': 'In remission',
  'Not applicable': 'Not applicable',
  'Recorded in error': 'Recorded in error',
};
