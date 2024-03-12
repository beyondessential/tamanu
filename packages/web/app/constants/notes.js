import { NOTE_TYPES, NOTE_TYPE_LABELS } from '@tamanu/constants';

// The order here is how they'll show up in the dropdown
// Treatment plan first and alphabetical after that
export const noteTypes = [
  { value: NOTE_TYPES.TREATMENT_PLAN, label: NOTE_TYPE_LABELS[NOTE_TYPES.TREATMENT_PLAN] },
  { value: NOTE_TYPES.ADMISSION, label: NOTE_TYPE_LABELS[NOTE_TYPES.ADMISSION] },
  {
    value: NOTE_TYPES.CLINICAL_MOBILE,
    label: NOTE_TYPE_LABELS[NOTE_TYPES.CLINICAL_MOBILE],
    hideFromDropdown: true,
  },
  { value: NOTE_TYPES.DIETARY, label: NOTE_TYPE_LABELS[NOTE_TYPES.DIETARY] },

  { value: NOTE_TYPES.DISCHARGE, label: NOTE_TYPE_LABELS[NOTE_TYPES.DISCHARGE] },
  { value: NOTE_TYPES.HANDOVER, label: NOTE_TYPE_LABELS[NOTE_TYPES.HANDOVER] },
  { value: NOTE_TYPES.MEDICAL, label: NOTE_TYPE_LABELS[NOTE_TYPES.MEDICAL] },
  { value: NOTE_TYPES.NURSING, label: NOTE_TYPE_LABELS[NOTE_TYPES.NURSING] },
  { value: NOTE_TYPES.OTHER, label: NOTE_TYPE_LABELS[NOTE_TYPES.OTHER] },
  { value: NOTE_TYPES.PHARMACY, label: NOTE_TYPE_LABELS[NOTE_TYPES.PHARMACY] },
  { value: NOTE_TYPES.PHYSIOTHERAPY, label: NOTE_TYPE_LABELS[NOTE_TYPES.PHYSIOTHERAPY] },
  { value: NOTE_TYPES.SOCIAL, label: NOTE_TYPE_LABELS[NOTE_TYPES.SOCIAL] },
  { value: NOTE_TYPES.SURGICAL, label: NOTE_TYPE_LABELS[NOTE_TYPES.SURGICAL] },
  { value: NOTE_TYPES.SYSTEM, label: NOTE_TYPE_LABELS[NOTE_TYPES.SYSTEM], hideFromDropdown: true },
];

export const NOTE_FORM_MODES = {
  CREATE_NOTE: 'createNote',
  EDIT_NOTE: 'editNote',
  VIEW_NOTE: 'viewNote',
};
