import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES } from '@tamanu/constants';

export const APPOINTMENT_TYPE_OPTIONS = Object.values(APPOINTMENT_TYPES).map(type => ({
  label: type,
  value: type,
}));

export const APPOINTMENT_STATUS_OPTIONS = Object.values(APPOINTMENT_STATUSES).map(status => ({
  label: status,
  value: status,
}));
