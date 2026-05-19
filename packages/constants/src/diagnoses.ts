export const PATIENT_ISSUE_TYPES = {
  ISSUE: 'issue',
  WARNING: 'warning',
} as const;

export const PATIENT_ISSUE_LABELS = {
  [PATIENT_ISSUE_TYPES.ISSUE]: 'Issue',
  [PATIENT_ISSUE_TYPES.WARNING]: 'Warning',
} as const;

export const AVPU_TYPES = {
  ALERT: 'alert',
  VERBAL: 'verbal',
  PAIN: 'pain',
  UNRESPONSIVE: 'unresponsive',
} as const;

export const AVPU_LABELS = {
  [AVPU_TYPES.ALERT]: 'Alert',
  [AVPU_TYPES.VERBAL]: 'Verbal',
  [AVPU_TYPES.PAIN]: 'Pain',
  [AVPU_TYPES.UNRESPONSIVE]: 'Unresponsive',
} as const;

export const AVPU_OPTIONS = [
  { value: AVPU_TYPES.ALERT, label: AVPU_LABELS[AVPU_TYPES.ALERT] },
  { value: AVPU_TYPES.VERBAL, label: AVPU_LABELS[AVPU_TYPES.VERBAL] },
  { value: AVPU_TYPES.PAIN, label: AVPU_LABELS[AVPU_TYPES.PAIN] },
  { value: AVPU_TYPES.UNRESPONSIVE, label: AVPU_LABELS[AVPU_TYPES.UNRESPONSIVE] },
] as const;

export const DIAGNOSIS_CERTAINTY = {
  SUSPECTED: 'suspected',
  CONFIRMED: 'confirmed',
  EMERGENCY: 'emergency',
  DISPROVEN: 'disproven',
  ERROR: 'error',
} as const;

export const DIAGNOSIS_CERTAINTY_LABELS = {
  [DIAGNOSIS_CERTAINTY.EMERGENCY]: 'ED Diagnosis',
  [DIAGNOSIS_CERTAINTY.SUSPECTED]: 'Suspected',
  [DIAGNOSIS_CERTAINTY.CONFIRMED]: 'Confirmed',
  [DIAGNOSIS_CERTAINTY.DISPROVEN]: 'Disproven',
  [DIAGNOSIS_CERTAINTY.ERROR]: 'Recorded in error',
} as const;

export const DIAGNOSIS_CERTAINTY_VALUES = Object.values(DIAGNOSIS_CERTAINTY);
export const DIAGNOSIS_CERTAINTIES_TO_HIDE = [
  DIAGNOSIS_CERTAINTY.DISPROVEN,
  DIAGNOSIS_CERTAINTY.ERROR,
] as const;
