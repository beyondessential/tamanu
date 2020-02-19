import * as Icons from '../components/Icons';
import { theme } from '../styled/theme';


export const DateFormats = {
  short: 'EEE, dd MMM',
  DAY_MONTH_YEAR_SHORT: 'dd MMM yyyy',
  DAY_MONTH: 'dd MMM',
  DDMMYY: 'dd/MM/yyyy',
  SHORT_MONTH: 'MMM',
};

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
  [VisitTypes.CLINIC]: Icons.Clipboard,
  [VisitTypes.HOSPITAL]: Icons.FirstAidKit,
  [VisitTypes.VISIT]: Icons.Stethoscope,
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
  NO_DATA: 'NO_DATA',
  SCHEDULED: 'SCHEDULED',
};


export const VaccineIcons = {
  [VaccineStatus.TAKEN]: {
    Icon: Icons.Checked,
    color: theme.colors.SAFE,
    text: 'TAKEN ON TIME',
  },
  [VaccineStatus.NOT_TAKEN]: {
    Icon: Icons.NotTaken,
    color: theme.colors.TEXT_SOFT,
    text: 'NOT TAKEN',
  },
  [VaccineStatus.TAKEN_NOT_ON_TIME]: {
    Icon: Icons.Checked,
    color: theme.colors.ORANGE,
    text: 'TAKEN NOT ON TIME',
  },
};

export const SCREEN_ORIENTATION = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
  SCHEDULED: 'SCHEDULED',
};

export const Routes = {
  SignUpStack: {
    SignIn: 'SignIn',
    Intro: 'Intro',
  },
};
