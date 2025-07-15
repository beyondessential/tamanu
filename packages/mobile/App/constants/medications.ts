// Please keep in sync with packages/constants/medications.ts

export const DRUG_UNITS = {
  percentage: '%',
  capsule: 'Capsule',
  disc: 'Disc',
  douche: 'Douche',
  drop: 'Drop',
  ffu: 'FFU',
  g: 'g',
  iu: 'IU',
  l: 'L',
  lozenge: 'Lozenge',
  mg: 'mg',
  mcg: 'mcg',
  ml: 'mL',
  mmol: 'mmol',
  mol: 'mol',
  patch: 'Patch',
  pellet: 'Pellet',
  pouch: 'Pouch',
  puff: 'Puff',
  ring: 'Ring',
  smear: 'Smear',
  spray: 'Spray',
  stick: 'Stick',
  strip: 'Strip',
  suppository: 'Suppository',
  swab: 'Swab',
  tablet: 'Tablet',
  tbsp: 'tbsp',
  tsp: 'tsp',
  u: 'U',
  vial: 'Vial',
  wafer: 'Wafer',
};

export const DRUG_UNIT_VALUES = Object.values(DRUG_UNITS);

export const DRUG_UNIT_LABELS = Object.values(DRUG_UNITS).reduce((prev, curr) => {
  prev[curr] = curr;
  return prev;
}, {} as any);

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

export const MEDICATION_DURATION_UNITS: { [key: string]: keyof Duration } = {
  HOURS: 'hours',
  DAYS: 'days',
  WEEKS: 'weeks',
  MONTHS: 'months',
};

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
  AS_DIRECTED: 'As directed',
  TWICE_DAILY_AM_AND_MIDDAY: 'Twice daily - AM and midday',
};

export const MEDICATION_DURATION_UNITS_LABELS = {
  [MEDICATION_DURATION_UNITS.HOURS!]: 'hour (s)',
  [MEDICATION_DURATION_UNITS.DAYS!]: 'day (s)',
  [MEDICATION_DURATION_UNITS.WEEKS!]: 'week (s)',
  [MEDICATION_DURATION_UNITS.MONTHS!]: 'month (s)',
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
  [ADMINISTRATION_FREQUENCIES.AS_DIRECTED]: [
    'MDU',
    'As directed by doctor',
    'M.D.U.',
    'As directed by prescriber',
    'Variable dose',
    'When required',
  ],
  [ADMINISTRATION_FREQUENCIES.TWICE_DAILY_AM_AND_MIDDAY]: [
    'AM and midday',
    'BD - AM and midday',
    'AM and lunch',
    'BD - AM and lunch',
  ],
};
