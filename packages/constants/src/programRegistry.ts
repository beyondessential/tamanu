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
  ...COLORS,
  brown: '#7A492E',
  teal: '#125E7E',
};
