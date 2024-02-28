export const BINARY = {
  YES: 'yes',
  NO: 'no',
  UNKNOWN: 'unknown',
};

export const BINARY_LABELS = {
  [BINARY.YES]: 'Yes',
  [BINARY.NO]: 'No',
  [BINARY.UNKNOWN]: 'Unknown',
};

export const BINARY_OPTIONS = [
  { value: BINARY.YES, label: BINARY_LABELS[BINARY.YES] },
  { value: BINARY.NO, label: BINARY_LABELS[BINARY.NO] },
];

export const BINARY_UNKNOWN_OPTIONS = [
  ...BINARY_OPTIONS,
  { value: BINARY.UNKNOWN, label: BINARY_LABELS[BINARY.UNKNOWN] },
];
