import { ENGLISH_LANGUAGE_CODE } from './translations';

export const DRUG_ROUTES = {
  dermal: 'dermal',
  ear: 'ear',
  eye: 'eye',
  intramuscular: 'intramuscular',
  intravenous: 'intravenous',
  inhaled: 'inhaled',
  nasal: 'nasal',
  oral: 'oral',
  rectal: 'rectal',
  subcutaneous: 'subcutaneous',
  sublingual: 'sublingual',
  topical: 'topical',
  vaginal: 'vaginal',
};

export const DRUG_ROUTE_VALUES = Object.values(DRUG_ROUTES);

export const DRUG_ROUTE_LABELS = {
  [DRUG_ROUTES.dermal]: 'Dermal',
  [DRUG_ROUTES.ear]: 'Ear',
  [DRUG_ROUTES.eye]: 'Eye',
  [DRUG_ROUTES.intramuscular]: 'IM',
  [DRUG_ROUTES.intravenous]: 'IV',
  [DRUG_ROUTES.inhaled]: 'Inhaled',
  [DRUG_ROUTES.nasal]: 'Nasal',
  [DRUG_ROUTES.oral]: 'Oral',
  [DRUG_ROUTES.rectal]: 'Rectal',
  [DRUG_ROUTES.subcutaneous]: 'S/C',
  [DRUG_ROUTES.sublingual]: 'Sublingual',
  [DRUG_ROUTES.topical]: 'Topical',
  [DRUG_ROUTES.vaginal]: 'Vaginal',
};

const MAX_REPEATS = 12;
export const REPEATS_LABELS = Array.from({ length: MAX_REPEATS + 1 }, (_, i) => i);

export const ADMINISTRATION_FREQUENCIES = {
  DAILY_IN_THE_MORNING: 'Daily in the morning',
  DAILY_AT_MIDDAY: 'Daily at midday',
  DAILY_AT_NIGHT: 'Daily at night',
  DAILY: 'Daily',
  TWO_TIMES_DAILY: 'Two times daily',
  THREE_TIMES_DAILY: 'Three times daily',
  FOUR_TIMES_DAILY: 'Four times daily',
  EVERY_4_HOURS: 'Every 4 hours',
  EVERY_6_HOURS: 'Every 6 hours',
  EVERY_8_HOURS: 'Every 8 hours',
  EVERY_SECOND_DAY: 'Every second day',
  ONCE_A_WEEK: 'Once a week',
  ONCE_A_MONTH: 'Once a month',
  IMMEDIATELY: 'Immediately',
  WHEN_REQUIRED: 'When required',
};

export const ADMINISTRATION_FREQUENCY_SYNONYMS = {
  [ADMINISTRATION_FREQUENCIES.DAILY_IN_THE_MORNING]: ['mane', 'Morning'],
  [ADMINISTRATION_FREQUENCIES.DAILY_AT_MIDDAY]: ['midday'],
  [ADMINISTRATION_FREQUENCIES.DAILY_AT_NIGHT]: ['nocte', 'nightly'],
  [ADMINISTRATION_FREQUENCIES.DAILY]: ['D', 'Every 24 hours', 'q24h', 'q1d', 'Q.D.', 'QD'],
  [ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY]: [
    'BD',
    'Every 12 hours',
    'q12h',
    'BID',
    'B.D.',
    'Twice a day',
  ],
  [ADMINISTRATION_FREQUENCIES.THREE_TIMES_DAILY]: ['TID', 'TDS', 'T.I.D.'],
  [ADMINISTRATION_FREQUENCIES.FOUR_TIMES_DAILY]: ['QID', 'QDS', 'Q.I.D.'],
  [ADMINISTRATION_FREQUENCIES.EVERY_4_HOURS]: ['q4h', '4h', '4 hourly', '4 hrly'],
  [ADMINISTRATION_FREQUENCIES.EVERY_6_HOURS]: ['q6h', '6h', '6 hourly', '6 hrly'],
  [ADMINISTRATION_FREQUENCIES.EVERY_8_HOURS]: ['q8h', '8h', '8 hourly', '8 hrly'],
  [ADMINISTRATION_FREQUENCIES.EVERY_SECOND_DAY]: ['QOD', 'Q.O.D.', 'Every other day'],
  [ADMINISTRATION_FREQUENCIES.ONCE_A_WEEK]: ['Weekly', 'Once weekly'],
  [ADMINISTRATION_FREQUENCIES.ONCE_A_MONTH]: [
    'Monthly',
    'Q.M.',
    'QM',
    'Once a month',
    'Once monthly',
  ],
  [ADMINISTRATION_FREQUENCIES.IMMEDIATELY]: ['STAT', 'Immediately'],
  [ADMINISTRATION_FREQUENCIES.WHEN_REQUIRED]: ['PRN', 'As required', 'No frequency'],
};

export const ADMINISTRATION_FREQUENCY_DETAILS = {
  [ADMINISTRATION_FREQUENCIES.DAILY_IN_THE_MORNING]: {
    startTimes: ['06:00'],
    dosesPerDay: 1,
  },
  [ADMINISTRATION_FREQUENCIES.DAILY_AT_MIDDAY]: {
    startTimes: ['12:00'],
    dosesPerDay: 1,
  },
  [ADMINISTRATION_FREQUENCIES.DAILY_AT_NIGHT]: {
    startTimes: ['18:00'],
    dosesPerDay: 1,
  },
  [ADMINISTRATION_FREQUENCIES.DAILY]: {
    startTimes: ['06:00'],
    dosesPerDay: 1,
  },
  [ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY]: {
    startTimes: ['06:00', '18:00'],
    dosesPerDay: 2,
  },
  [ADMINISTRATION_FREQUENCIES.THREE_TIMES_DAILY]: {
    startTimes: ['06:00', '12:00', '18:00'],
    dosesPerDay: 3,
  },
  [ADMINISTRATION_FREQUENCIES.FOUR_TIMES_DAILY]: {
    startTimes: ['06:00', '12:00', '18:00', '22:00'],
    dosesPerDay: 4,
  },
  [ADMINISTRATION_FREQUENCIES.EVERY_4_HOURS]: {
    startTimes: ['02:00', '06:00', '10:00', '14:00', '18:00', '22:00'],
    dosesPerDay: 6,
  },
  [ADMINISTRATION_FREQUENCIES.EVERY_6_HOURS]: {
    startTimes: ['00:00', '06:00', '12:00', '18:00'],
    dosesPerDay: 4,
  },
  [ADMINISTRATION_FREQUENCIES.EVERY_8_HOURS]: {
    startTimes: ['06:00', '14:00', '22:00'],
    dosesPerDay: 3,
  },
  [ADMINISTRATION_FREQUENCIES.EVERY_SECOND_DAY]: {
    startTimes: ['06:00'],
    dosesPerDay: 1 / 2,
  },
  [ADMINISTRATION_FREQUENCIES.ONCE_A_WEEK]: {
    startTimes: ['06:00'],
    dosesPerDay: 1 / 7,
  },
  [ADMINISTRATION_FREQUENCIES.ONCE_A_MONTH]: {
    startTimes: ['06:00'],
    dosesPerDay: 1 / 28,
  },
  [ADMINISTRATION_FREQUENCIES.IMMEDIATELY]: {
    startTimes: null,
    dosesPerDay: null,
  },
  [ADMINISTRATION_FREQUENCIES.WHEN_REQUIRED]: {
    startTimes: null,
    dosesPerDay: null,
  },
};
