export enum CurrentlyAtType {
  Village = 'village',
  Facility = 'facility',
}

export enum RegistrationStatus {
  Active = 'active',
  Inactive = 'inactive',
  RecordedInError = 'recordedInError',
}

// Please keep in sync with packages/web/app/constants/index.js
export const PROGRAM_REGISTRATION_STATUS_LABELS = {
  [RegistrationStatus.Active]: 'Active',
  [RegistrationStatus.Inactive]: 'Removed',
  [RegistrationStatus.RecordedInError]: 'Delete',
};

/**
 * ########################################################################################################
 *       These categories must be kept in sync with the ones in @tamanu/constants/programRegistry
 * ########################################################################################################
 */
export const PROGRAM_REGISTRY_CONDITION_CATEGORIES = {
  SUSPECTED: 'suspected',
  UNDER_INVESTIGATION: 'underInvestigation',
  UNKNOWN: 'unknown',
  CONFIRMED: 'confirmed',
  IN_REMISSION: 'inRemission',
  NOT_APPLICABLE: 'notApplicable',
  RECORDED_IN_ERROR: 'recordedInError',
  DISPROVEN: 'disproven',
  RESOLVED: 'resolved',
};

export const PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS = {
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.SUSPECTED]: 'Suspected',
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNDER_INVESTIGATION]: 'Under investigation',
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.CONFIRMED]: 'Confirmed',
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN]: 'Unknown',
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.DISPROVEN]: 'Disproven',
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.RESOLVED]: 'Resolved',
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.IN_REMISSION]: 'In remission',
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.NOT_APPLICABLE]: 'Not applicable',
  [PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR]: 'Recorded in error',
};

// ########################################################################################################
