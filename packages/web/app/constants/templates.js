import { TEMPLATE_TYPES } from '@tamanu/constants';

export const TEMPLATE_TYPE_LABELS = {
  [TEMPLATE_TYPES.PATIENT_LETTER]: 'Patient Letter',
};

export const TEMPLATE_TYPE_OPTIONS = [
  {
    value: TEMPLATE_TYPES.PATIENT_LETTER,
    label: TEMPLATE_TYPE_LABELS[TEMPLATE_TYPES.PATIENT_LETTER],
  },
];
