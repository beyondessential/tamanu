/**
 * ########################################################################################################
 *       All constants in this file must be kept in sync with the ones in @tamanu/constants/programRegistry
 * ########################################################################################################
 */

export const CurrentlyAtType = {
  Village: 'village',
  Facility: 'facility',
} as const;

export type CurrentlyAtType = (typeof CurrentlyAtType)[keyof typeof CurrentlyAtType];

export const RegistrationStatus = {
  Active: 'active',
  Inactive: 'inactive',
  RecordedInError: 'recordedInError',
} as const;

export type RegistrationStatus = (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const PROGRAM_REGISTRATION_STATUS_LABELS = {
  [RegistrationStatus.Active]: 'Active',
  [RegistrationStatus.Inactive]: 'Removed',
  [RegistrationStatus.RecordedInError]: 'Delete',
};

// Categories are now added as reference data in their own table, however,
// these constants are mandatory on import and will be used to define UI behavior
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

// This exists for backwards compatibility with the old enum values
export const DEPRECATED_PRCC_LABELS = {
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

// ########################################################################################################
