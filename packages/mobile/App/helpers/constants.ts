import * as Icons from '../components/Icons';

export const DateFormats = {
  short: 'EEE, dd MMM',
  DAY_MONTH_YEAR_SHORT: 'dd MMM yyyy',
  'DD/MM/YY': 'dd/MM/yy',
};

export const HistoryTypes = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clinic',
  VISIT: 'Visit',
};

export const HeaderIcons = {
  [HistoryTypes.CLINIC]: Icons.FirstAidKit,
  [HistoryTypes.HOSPITAL]: Icons.Clipboard,
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
