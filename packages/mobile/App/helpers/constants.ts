import Icons from '../components/Icons';

export const DateFormats = {
  short: 'EEE, dd MMM',
  DAY_MONTH_YEAR_SHORT: 'dd MMM yyyy',
};

export const HistoryTypes = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clinic',
};

export const HeaderIcons = {
  [HistoryTypes.CLINIC]: Icons.FirstAidKit,
  [HistoryTypes.HOSPITAL]: Icons.Clipboard,
};
