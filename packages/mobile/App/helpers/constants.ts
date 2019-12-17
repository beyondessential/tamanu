import * as Icons from '../components/Icons';

export const DateFormats = {
  short: 'EEE, dd MMM',
  DAY_MONTH_YEAR_SHORT: 'dd MMM yyyy',
  DDMMYY: 'dd/MM/yyyy',
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
  'blood_pressure',
  'weight',
  'circumference',
  'sp02',
  'heart_rate',
  'fev',
  'cholesterol',
  'blood_glucose',
];
