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
export const PROGRAM_REGISTRATION_STATUS_LABEL = {
  [RegistrationStatus.Active]: 'Active',
  [RegistrationStatus.Inactive]: 'Removed',
  [RegistrationStatus.RecordedInError]: 'Delete',
};
