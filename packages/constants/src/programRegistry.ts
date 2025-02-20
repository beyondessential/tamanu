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
  suspected: 'Suspected',
  underInvestigation: 'Under investigation',
  confirmed: 'Confirmed',
  unknown: 'Unknown',
  disproven: 'Disproven',
  resolved: 'Resolved',
  inRemission: 'In remission',
  notApplicable: 'Not applicable',
  recordedInError: 'Recorded in error',
};
