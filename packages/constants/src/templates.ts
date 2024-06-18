import { NOTE_TYPES, NOTE_TYPE_LABELS } from './notes';

export const TEMPLATE_TYPES = {
  PATIENT_LETTER: 'patientLetter',
  TREATMENT_PLAN: NOTE_TYPES.TREATMENT_PLAN,
  ADMISSION: NOTE_TYPES.ADMISSION,
  DIETARY: NOTE_TYPES.DIETARY,
  DISCHARGE: NOTE_TYPES.DISCHARGE,
  HANDOVER: NOTE_TYPES.HANDOVER,
  MEDICAL: NOTE_TYPES.MEDICAL,
  NURSING: NOTE_TYPES.NURSING,
  OTHER: NOTE_TYPES.OTHER,
  PHARMACY: NOTE_TYPES.PHARMACY,
  PHYSIOTHERAPY: NOTE_TYPES.PHYSIOTHERAPY,
  SOCIAL: NOTE_TYPES.SOCIAL,
  SURGICAL: NOTE_TYPES.SURGICAL,
};

export const TEMPLATE_TYPE_LABELS = {
  [TEMPLATE_TYPES.PATIENT_LETTER]: 'Patient letter',
  [TEMPLATE_TYPES.TREATMENT_PLAN]: NOTE_TYPE_LABELS[NOTE_TYPES.TREATMENT_PLAN],
  [TEMPLATE_TYPES.ADMISSION]: NOTE_TYPE_LABELS[NOTE_TYPES.ADMISSION],
  [TEMPLATE_TYPES.MEDICAL]: NOTE_TYPE_LABELS[NOTE_TYPES.MEDICAL],
  [TEMPLATE_TYPES.SURGICAL]: NOTE_TYPE_LABELS[NOTE_TYPES.SURGICAL],
  [TEMPLATE_TYPES.NURSING]: NOTE_TYPE_LABELS[NOTE_TYPES.NURSING],
  [TEMPLATE_TYPES.DIETARY]: NOTE_TYPE_LABELS[NOTE_TYPES.DIETARY],
  [TEMPLATE_TYPES.PHARMACY]: NOTE_TYPE_LABELS[NOTE_TYPES.PHARMACY],
  [TEMPLATE_TYPES.PHYSIOTHERAPY]: NOTE_TYPE_LABELS[NOTE_TYPES.PHYSIOTHERAPY],
  [TEMPLATE_TYPES.SOCIAL]: NOTE_TYPE_LABELS[NOTE_TYPES.SOCIAL],
  [TEMPLATE_TYPES.DISCHARGE]: NOTE_TYPE_LABELS[NOTE_TYPES.DISCHARGE],
  [TEMPLATE_TYPES.OTHER]: NOTE_TYPE_LABELS[NOTE_TYPES.OTHER],
  [TEMPLATE_TYPES.HANDOVER]: NOTE_TYPE_LABELS[NOTE_TYPES.HANDOVER],
};
