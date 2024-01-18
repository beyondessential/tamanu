export const PATIENT_REGISTRY_TYPES = {
  NEW_PATIENT: 'new_patient',
  BIRTH_REGISTRY: 'birth_registry',
};

export const BIRTH_DELIVERY_TYPES = {
  NORMAL_VAGINAL_DELIVERY: 'normal_vaginal_delivery',
  BREECH: 'breech',
  EMERGENCY_C_SECTION: 'emergency_c_section',
  ELECTIVE_C_SECTION: 'elective_c_section',
  VACUUM_EXTRACTION: 'vacuum_extraction',
  FORCEPS: 'forceps',
  OTHER: 'other',
};

export const BIRTH_TYPES = {
  SINGLE: 'single',
  PLURAL: 'plural',
};

export const PLACE_OF_BIRTH_TYPES = {
  HEALTH_FACILITY: 'health_facility',
  HOME: 'home',
  OTHER: 'other',
};

export const ATTENDANT_OF_BIRTH_TYPES = {
  DOCTOR: 'doctor',
  MIDWIFE: 'midwife',
  NURSE: 'nurse',
  TRADITIONAL_BIRTH_ATTENDANT: 'traditional_birth_attentdant',
  OTHER: 'other',
};

export const ATTENDANT_OF_BIRTH_OPTIONS = [
  { value: ATTENDANT_OF_BIRTH_TYPES.DOCTOR, label: 'Doctor' },
  { value: ATTENDANT_OF_BIRTH_TYPES.MIDWIFE, label: 'Midwife' },
  { value: ATTENDANT_OF_BIRTH_TYPES.NURSE, label: 'Nurse' },
  {
    value: ATTENDANT_OF_BIRTH_TYPES.TRADITIONAL_BIRTH_ATTENDANT,
    label: 'Traditional birth attendant',
  },
  { value: ATTENDANT_OF_BIRTH_TYPES.OTHER, label: 'Other' },
];

export const BIRTH_DELIVERY_TYPE_OPTIONS = [
  { value: BIRTH_DELIVERY_TYPES.NORMAL_VAGINAL_DELIVERY, label: 'Normal vaginal delivery' },
  { value: BIRTH_DELIVERY_TYPES.BREECH, label: 'Breech' },
  { value: BIRTH_DELIVERY_TYPES.EMERGENCY_C_SECTION, label: 'Emergency C-section' },
  { value: BIRTH_DELIVERY_TYPES.ELECTIVE_C_SECTION, label: 'Elective C-section' },
  { value: BIRTH_DELIVERY_TYPES.VACUUM_EXTRACTION, label: 'Vacuum extraction' },
  { value: BIRTH_DELIVERY_TYPES.FORCEPS, label: 'Forceps' },
  { value: BIRTH_DELIVERY_TYPES.OTHER, label: 'Other' },
];

export const BIRTH_TYPE_OPTIONS = [
  { value: BIRTH_TYPES.SINGLE, label: 'Single' },
  { value: BIRTH_TYPES.PLURAL, label: 'Plural' },
];

export const PLACE_OF_BIRTH_OPTIONS = [
  { value: PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY, label: 'Health facility' },
  { value: PLACE_OF_BIRTH_TYPES.HOME, label: 'Home' },
  { value: PLACE_OF_BIRTH_TYPES.OTHER, label: 'Other' },
];