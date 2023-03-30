export const PATIENT_ISSUE_TYPES = {
  ISSUE: 'issue',
  WARNING: 'warning',
};

export const AVPU_OPTIONS = [
  { value: 'alert', label: 'Alert' },
  { value: 'verbal', label: 'Verbal' },
  { value: 'pain', label: 'Pain' },
  { value: 'unresponsive', label: 'Unresponsive' },
];

export const DIAGNOSIS_CERTAINTY = {
  SUSPECTED: 'suspected',
  CONFIRMED: 'confirmed',
  EMERGENCY: 'emergency',
  DISPROVEN: 'disproven',
  ERROR: 'error',
};

export const DIAGNOSIS_CERTAINTY_VALUES = Object.values(DIAGNOSIS_CERTAINTY);
export const DIAGNOSIS_CERTAINTIES_TO_HIDE = [
  DIAGNOSIS_CERTAINTY.DISPROVEN,
  DIAGNOSIS_CERTAINTY.ERROR,
];
