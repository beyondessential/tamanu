import { EncounterType } from '~/types';
import * as Icons from '/components/Icons';
import { theme } from '/styled/theme';

export const DateFormats = {
  short: 'EEE, dd MMM',
  DAY_MONTH_YEAR_SHORT: 'dd MMM yyyy',
  DAY_MONTH: 'dd MMM',
  DDMMYY: 'dd/MM/yyyy',
  SHORT_MONTH: 'MMM',
};

export const BloodTypes = [
  {
    value: 'A+',
    label: 'A+',
  },
  {
    value: 'A-',
    label: 'A-',
  },
  {
    value: 'B+',
    label: 'B+',
  },
  {
    value: 'O+',
    label: 'O+',
  },
  {
    value: 'AB+',
    label: 'AB+',
  },
  {
    value: 'AB-',
    label: 'AB-',
  },
];

export const TimeFormats = {
  HHMMSS: 'pp',
};

export const FilterTypeAll = 'All';

export const VisitTypes = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clinic',
  VISIT: 'Visit',
};

export const HeaderIcons = {
  //TODO: find correct icons for each EncounterType
  [EncounterType.Clinic]: Icons.ClipboardIcon,
  [EncounterType.Emergency]: Icons.FirstAidKitIcon,
  [EncounterType.Admission]: Icons.StethoscopeIcon,
  [EncounterType.Imaging]: Icons.FirstAidKitIcon,
  [EncounterType.Observation]: Icons.FirstAidKitIcon,
  [EncounterType.Triage]: Icons.FirstAidKitIcon,
  [EncounterType.SurveyResponse]: Icons.FirstAidKitIcon,
};

export const PatientVitalsList = [
  'height',
  'weight',
  'temperature',
  'sbp',
  'dbp',
  'heartRate',
  'respiratoryRate',
  'sv02',
  'avpu',
];

const seniorDoctorRole = {
  value: 'senior-doctor',
  label: 'Senior Doctor',
};
const juniorDoctorRole = {
  value: 'junior-doctor',
  label: 'Junior Doctor',
};
const seniorNurse = {
  value: 'senior-nurse',
  label: 'Senior Nurse',
};
const juniorNurse = {
  value: 'junior-nurse',
  label: 'Junior Nurse',
};
const midWife = {
  value: 'midwife',
  label: 'Midwife',
};
const appliedHealth = {
  value: 'applied-health',
  label: 'Applied Health',
};
const finnanceRole = {
  value: 'finance',
  label: 'Finance',
};
const radiologyRole = {
  value: 'radiology',
  label: 'Radiology',
};
const labRole = {
  value: 'lab',
  label: 'Lab',
};
export const userRolesOptions = [
  seniorDoctorRole,
  juniorDoctorRole,
  seniorNurse,
  juniorNurse,
  midWife,
  appliedHealth,
  finnanceRole,
  radiologyRole,
  labRole,
];

export const VaccineStatus = {
  TAKEN: 'TAKEN',
  TAKEN_NOT_ON_TIME: 'TAKEN_NOT_ON_TIME',
  NOT_TAKEN: 'NOT_TAKEN',
  SCHEDULED: 'SCHEDULED',
};
export const VaccineIcons = {
  [VaccineStatus.TAKEN]: {
    Icon: Icons.TakenOnTimeIcon,
    color: theme.colors.SAFE,
    text: 'TAKEN ON TIME',
  },
  [VaccineStatus.NOT_TAKEN]: {
    Icon: Icons.NotTakenIcon,
    color: theme.colors.TEXT_SOFT,
    text: 'NOT TAKEN',
  },
  [VaccineStatus.TAKEN_NOT_ON_TIME]: {
    Icon: Icons.TakenNotOnTimeIcon,
    color: theme.colors.ORANGE,
    text: 'TAKEN NOT ON TIME',
  },
  [VaccineStatus.SCHEDULED]: {
    Icon: Icons.EmptyCircleIcon,
    color: theme.colors.ORANGE,
    text: 'SCHEDULED',
  },
};

export const PhoneMask = { mask: '9999 9999 999' };

export const Gender = {
  Male: 'male',
  Female: 'female',
  Other: 'other',
};

export const MaleGender = {
  label: 'Male',
  value: Gender.Male,
};

export const OtherGender = {
  label: 'Other',
  value: Gender.Other,
};

export const FemaleGender = {
  label: 'Female',
  value: Gender.Female,
};

export const GenderOptions = [MaleGender, FemaleGender, OtherGender];

export const MarriedStatus = {
  value: 'married',
  label: 'Married',
};
export const SingleStatus = { value: 'single', label: 'Single' };
export const Other = { value: 'other', label: 'Other' };
export const MaritalStatusOptions = [SingleStatus, MarriedStatus, Other];
