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
  WHEN_REQUIRE: 'When required',
};

export const ADMINISTRATION_FREQUENCY_DETAILS = {
  en: {
    [ADMINISTRATION_FREQUENCIES.DAILY_IN_THE_MORNING]: {
      synonyms: ['mane', 'Morning'],
      startTimes: ['06:00'],
      dosesPerDay: 1,
    },
    [ADMINISTRATION_FREQUENCIES.DAILY_AT_MIDDAY]: {
      synonyms: ['midday'],
      startTimes: ['12:00'],
      dosesPerDay: 1,
    },
    [ADMINISTRATION_FREQUENCIES.DAILY_AT_NIGHT]: {
      synonyms: ['nocte', 'nightly'],
      startTimes: ['18:00'],
      dosesPerDay: 1,
    },
    [ADMINISTRATION_FREQUENCIES.DAILY]: {
      synonyms: ['D', 'Every 24 hours', 'q24h', 'q1d', 'Q.D.', 'QD'],
      startTimes: ['06:00'],
      dosesPerDay: 1,
    },
    [ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY]: {
      synonyms: ['BD', 'Every 12 hours', 'q12h', 'BID', 'B.D.', 'Twice a day'],
      startTimes: ['06:00', '18:00'],
      dosesPerDay: 2,
    },
    [ADMINISTRATION_FREQUENCIES.THREE_TIMES_DAILY]: {
      synonyms: ['TID', 'TDS', 'T.I.D.'],
      startTimes: ['06:00', '14:00', '22:00'],
      dosesPerDay: 3,
    },
    [ADMINISTRATION_FREQUENCIES.FOUR_TIMES_DAILY]: {
      synonyms: ['QID', 'QDS', 'Q.I.D.'],
      startTimes: ['06:00', '12:00', '18:00', '22:00'],
      dosesPerDay: 4,
    },
    [ADMINISTRATION_FREQUENCIES.EVERY_4_HOURS]: {
      synonyms: ['q4h', '4h', '4 hourly', '4 hrly'],
      startTimes: ['02:00', '06:00', '10:00', '14:00', '18:00', '22:00'],
      dosesPerDay: 6,
    },
    [ADMINISTRATION_FREQUENCIES.EVERY_6_HOURS]: {
      synonyms: ['q6h', '6h', '6 hourly', '6 hrly'],
      startTimes: ['00:00', '06:00', '12:00', '18:00'],
      dosesPerDay: 4,
    },
    [ADMINISTRATION_FREQUENCIES.EVERY_8_HOURS]: {
      synonyms: ['q8h', '8h', '8 hourly', '8 hrly'],
      startTimes: ['00:00', '08:00', '16:00'],
      dosesPerDay: 3,
    },
    [ADMINISTRATION_FREQUENCIES.EVERY_SECOND_DAY]: {
      synonyms: ['QOD', 'Q.O.D.', 'Every other day'],
      startTimes: ['06:00'],
      dosesPerDay: 0.5,
    },
    [ADMINISTRATION_FREQUENCIES.ONCE_A_WEEK]: {
      synonyms: ['Weekly', 'Once weekly'],
      startTimes: ['06:00'],
      dosesPerDay: 1 / 7,
    },
    [ADMINISTRATION_FREQUENCIES.ONCE_A_MONTH]: {
      synonyms: ['Monthly', 'Q.M.', 'QM', 'Once a month', 'Once monthly'],
      startTimes: ['06:00'],
      dosesPerDay: 1 / 28,
    },
    [ADMINISTRATION_FREQUENCIES.IMMEDIATELY]: {
      synonyms: ['STAT', 'Immediately'],
      startTimes: null,
      dosesPerDay: null,
    },
    [ADMINISTRATION_FREQUENCIES.WHEN_REQUIRE]: {
      synonyms: ['PRN', 'As required', 'No frequency'],
      startTimes: null,
      dosesPerDay: null,
    },
  },
};
