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

export const DRUG_UNIT_SHORT_LABELS = {
  [DRUG_UNITS.percentage]: '%',
  [DRUG_UNITS.capsule]: 'Cap',
  [DRUG_UNITS.disc]: 'Disc',
  [DRUG_UNITS.douche]: 'Dche',
  [DRUG_UNITS.drop]: 'Drop',
  [DRUG_UNITS.ffu]: 'FFU',
  [DRUG_UNITS.g]: 'g',
  [DRUG_UNITS.iu]: 'IU',
  [DRUG_UNITS.l]: 'L',
  [DRUG_UNITS.lozenge]: 'Loz',
  [DRUG_UNITS.mg]: 'mg',
  [DRUG_UNITS.mcg]: 'mcg',
  [DRUG_UNITS.ml]: 'mL',
  [DRUG_UNITS.mmol]: 'mmol',
  [DRUG_UNITS.mol]: 'mol',
  [DRUG_UNITS.patch]: 'Patch',
  [DRUG_UNITS.pellet]: 'Pellet',
  [DRUG_UNITS.pouch]: 'Pouch',
  [DRUG_UNITS.puff]: 'Puff',
  [DRUG_UNITS.ring]: 'Ring',
  [DRUG_UNITS.smear]: 'Smear',
  [DRUG_UNITS.spray]: 'Spray',
  [DRUG_UNITS.stick]: 'Stick',
  [DRUG_UNITS.strip]: 'Strip',
  [DRUG_UNITS.suppository]: 'Supp',
  [DRUG_UNITS.swab]: 'Swab',
  [DRUG_UNITS.tablet]: 'Tab',
  [DRUG_UNITS.tbsp]: 'tbsp',
  [DRUG_UNITS.tsp]: 'tsp',
  [DRUG_UNITS.u]: 'U',
  [DRUG_UNITS.vial]: 'Vial',
  [DRUG_UNITS.wafer]: 'Wafer',
};

export const MAX_REPEATS = 12;
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
  AS_DIRECTED: 'As directed',
  TWICE_DAILY_AM_AND_MIDDAY: 'Twice daily - AM and midday',
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
  [ADMINISTRATION_FREQUENCIES.AS_DIRECTED]: {
    startTimes: null,
    dosesPerDay: null,
  },
  [ADMINISTRATION_FREQUENCIES.TWICE_DAILY_AM_AND_MIDDAY]: {
    startTimes: ['06:00', '12:00'],
    dosesPerDay: 2,
  },
};

export const MEDICATION_DURATION_UNITS: { [key: string]: keyof Duration } = {
  HOURS: 'hours',
  DAYS: 'days',
  WEEKS: 'weeks',
  MONTHS: 'months',
};

export const MEDICATION_DURATION_DISPLAY_UNITS_LABELS = {
  [MEDICATION_DURATION_UNITS.HOURS!]: 'Hours',
  [MEDICATION_DURATION_UNITS.DAYS!]: 'Days',
  [MEDICATION_DURATION_UNITS.WEEKS!]: 'Weeks',
  [MEDICATION_DURATION_UNITS.MONTHS!]: 'Months',
};

export const MEDICATION_DURATION_UNITS_LABELS = {
  [MEDICATION_DURATION_UNITS.HOURS!]: 'hour (s)',
  [MEDICATION_DURATION_UNITS.DAYS!]: 'day (s)',
  [MEDICATION_DURATION_UNITS.WEEKS!]: 'week (s)',
  [MEDICATION_DURATION_UNITS.MONTHS!]: 'month (s)',
};

export const MEDICATION_PAUSE_DURATION_UNITS_LABELS = {
  [MEDICATION_DURATION_UNITS.HOURS!]: 'hour (s)',
  [MEDICATION_DURATION_UNITS.DAYS!]: 'day (s)',
};

export const ADMINISTRATION_STATUS = {
  GIVEN: 'given',
  NOT_GIVEN: 'not-given',
};

export const ADMINISTRATION_STATUS_LABELS = {
  [ADMINISTRATION_STATUS.GIVEN]: 'Given',
  [ADMINISTRATION_STATUS.NOT_GIVEN]: 'Not given',
};

export const MEDICATION_ADMINISTRATION_TIME_SLOTS = [
  { startTime: '00:00', endTime: '02:00' },
  { startTime: '02:00', endTime: '04:00' },
  { startTime: '04:00', endTime: '06:00' },
  { startTime: '06:00', endTime: '08:00', periodLabel: 'breakfast' },
  { startTime: '08:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '12:00' },
  { startTime: '12:00', endTime: '14:00', periodLabel: 'lunch' },
  { startTime: '14:00', endTime: '16:00' },
  { startTime: '16:00', endTime: '18:00' },
  { startTime: '18:00', endTime: '20:00', periodLabel: 'dinner' },
  { startTime: '20:00', endTime: '22:00' },
  { startTime: '22:00', endTime: '24:00', periodLabel: 'night' },
];
