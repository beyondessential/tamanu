import { ENCOUNTER_TYPE_PATIENT_STATUSES, PATIENT_STATUSES } from '@tamanu/constants';
import { PATIENT_STATUS } from '../constants';

// The web's PATIENT_STATUS values are what callers compare getPatientStatus against and key colours
// by. PATIENT_STATUS_LABELS reads the same today, but it's translation fallback text, so it's kept
// separate: rewording a label must not change these comparisons.
const STATUS_TO_LABEL = {
  [PATIENT_STATUSES.INPATIENT]: PATIENT_STATUS.INPATIENT,
  [PATIENT_STATUSES.OUTPATIENT]: PATIENT_STATUS.OUTPATIENT,
  [PATIENT_STATUSES.EMERGENCY]: PATIENT_STATUS.EMERGENCY,
};

export const getPatientStatus = encounterType => {
  if (!encounterType) {
    return '';
  }
  return STATUS_TO_LABEL[ENCOUNTER_TYPE_PATIENT_STATUSES[encounterType]];
};
