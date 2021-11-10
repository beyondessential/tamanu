import { ENCOUNTER_TYPES } from 'shared/constants';

export const getAdmissionType = encounterType => {
  switch (encounterType) {
    case ENCOUNTER_TYPES.TRIAGE:
      return 'Triage';
    case ENCOUNTER_TYPES.OBSERVATION:
      return 'Active ED patient';
    case ENCOUNTER_TYPES.EMERGENCY:
      return 'Emergency short stay';
    case ENCOUNTER_TYPES.ADMISSION:
      return 'Hospital admission';
    case ENCOUNTER_TYPES.CLINIC:
      return 'Clinic';
    case ENCOUNTER_TYPES.IMAGING:
    default:
      return 'Imaging';
  }
};
