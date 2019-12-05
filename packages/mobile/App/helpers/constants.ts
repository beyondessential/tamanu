import Icons from '../components/Icons';

export const DateFormats = {
  short: 'EEE, dd MMM',
  DAY_MONTH_YEAR_SHORT: 'dd MMM yyyy',
  'DD/MM/YY': 'DD/MM/YY',
};

export const HistoryTypes = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clinic',
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
