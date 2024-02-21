export const PATIENT_ISSUE_TYPES = {
  ISSUE: 'issue',
  WARNING: 'warning',
};

export const AVPU_TYPES = {
  ALERT: 'alert',
  VERBAL: 'verbal',
  PAIN: 'pain',
  UNRESPONSIVE: 'unresponsive',
};

export const AVPU_LABELS = {
  [AVPU_TYPES.ALERT]: 'Alert',
  [AVPU_TYPES.VERBAL]: 'Verbal',
  [AVPU_TYPES.PAIN]: 'Pain',
  [AVPU_TYPES.UNRESPONSIVE]: 'Unresponsive',
};

export const AVPU_OPTIONS = [
  { value: AVPU_TYPES.ALERT, label: AVPU_LABELS[AVPU_TYPES.ALERT] },
  { value: AVPU_TYPES.VERBAL, label: AVPU_LABELS[AVPU_TYPES.VERBAL] },
  { value: AVPU_TYPES.PAIN, label: AVPU_LABELS[AVPU_TYPES.PAIN] },
  { value: AVPU_TYPES.UNRESPONSIVE, label: AVPU_LABELS[AVPU_TYPES.UNRESPONSIVE] },
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
