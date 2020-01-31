import * as Icons from '../components/Icons';

export const DateFormats = {
  short: 'EEE, dd MMM',
  DAY_MONTH_YEAR_SHORT: 'dd MMM yyyy',
  DAY_MONTH: 'dd MMM',
  DDMMYY: 'dd/MM/yyyy',
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
  SCHEDULED: 'SCHEDULED',
};

export const VaccineIcons = {
  [VaccineStatus.TAKEN]: Icons.Checked,
  [VaccineStatus.NOT_TAKEN]: Icons.NotTaken,
  [VaccineStatus.TAKEN_NOT_ON_TIME]: Icons.TakenNotOnTime,
  [VaccineStatus.SCHEDULED]: Icons.ScheduledVaccine,
};
