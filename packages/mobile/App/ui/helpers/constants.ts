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
  [VisitTypes.CLINIC]: Icons.ClipboardIcon,
  [VisitTypes.HOSPITAL]: Icons.FirstAidKitIcon,
  [VisitTypes.VISIT]: Icons.StethoscopeIcon,
};

export const PatientVitalsList = [
  'bloodPressure',
  'weight',
  'circumference',
  'sp02',
  'heartRate',
  'fev',
  'cholesterol',
  'bloodGlucose',
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

export const SCREEN_ORIENTATION = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
};

export const PhoneMask = { mask: '9999 9999 999' };

export const MaleGender = {
  label: 'Male',
  value: 'male',
};

export const OtherGender = {
  label: 'Other',
  value: 'other',
};

export const FemaleGender = {
  label: 'Female',
  value: 'female',
};

export const GenderOptions = [MaleGender, FemaleGender, OtherGender];

export const MarriedStatus = {
  value: 'married',
  label: 'Married',
};
export const SingleStatus = { value: 'single', label: 'Single' };
export const Other = { value: 'other', label: 'Other' };
export const MaritalStatusOptions = [SingleStatus, MarriedStatus, Other];
