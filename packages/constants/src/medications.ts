import type { Duration } from 'date-fns';
import { ENCOUNTER_TYPES } from './encounters';

export const DRUG_ROUTES = {
  dermal: 'dermal',
  ear: 'ear',
  eye: 'eye',
  intramuscular: 'intramuscular',
  intravenous: 'intravenous',
  intraocular: 'intraocular',
  intravitreal: 'intravitreal',
  inhaled: 'inhaled',
  nasal: 'nasal',
  oral: 'oral',
  rectal: 'rectal',
  subcutaneous: 'subcutaneous',
  sublingual: 'sublingual',
  topical: 'topical',
  vaginal: 'vaginal',
} as const;

export const DRUG_ROUTE_VALUES = Object.values(DRUG_ROUTES);

export const DRUG_ROUTE_LABELS = {
  [DRUG_ROUTES.dermal]: 'Dermal',
  [DRUG_ROUTES.ear]: 'Ear',
  [DRUG_ROUTES.eye]: 'Eye',
  [DRUG_ROUTES.intramuscular]: 'IM',
  [DRUG_ROUTES.intravenous]: 'IV',
  [DRUG_ROUTES.intraocular]: 'Intraocular',
  [DRUG_ROUTES.intravitreal]: 'Intravitreal',
  [DRUG_ROUTES.inhaled]: 'Inhaled',
  [DRUG_ROUTES.nasal]: 'Nasal',
  [DRUG_ROUTES.oral]: 'Oral',
  [DRUG_ROUTES.rectal]: 'Rectal',
  [DRUG_ROUTES.subcutaneous]: 'S/C',
  [DRUG_ROUTES.sublingual]: 'Sublingual',
  [DRUG_ROUTES.topical]: 'Topical',
  [DRUG_ROUTES.vaginal]: 'Vaginal',
} as const;

export const DRUG_UNITS = {
  percentage: '%',
  ampule: 'Ampule',
  applicator: 'Applicator',
  bag: 'Bag',
  blisterPack: 'Blister Pack',
  bottle: 'Bottle',
  box: 'Box',
  can: 'Can',
  canister: 'Canister',
  capsule: 'Capsule',
  carton: 'Carton',
  cartridge: 'Cartridge',
  disc: 'Disc',
  douche: 'Douche',
  drop: 'Drop',
  each: 'Each',
  ffu: 'FFU',
  g: 'g',
  inhaler: 'Inhaler',
  iu: 'IU',
  jar: 'Jar',
  kit: 'Kit',
  l: 'L',
  lozenge: 'Lozenge',
  millionUnits: 'Million units',
  mg: 'mg',
  mcg: 'mcg',
  ml: 'mL',
  mmol: 'mmol',
  mol: 'mol',
  pack: 'Pack',
  package: 'Package',
  patch: 'Patch',
  pellet: 'Pellet',
  pen: 'Pen',
  pouch: 'Pouch',
  puff: 'Puff',
  ring: 'Ring',
  roll: 'Roll',
  sachet: 'Sachet',
  smear: 'Smear',
  spray: 'Spray',
  stick: 'Stick',
  strip: 'Strip',
  suppository: 'Suppository',
  swab: 'Swab',
  syringe: 'Syringe',
  tablet: 'Tablet',
  tbsp: 'tbsp',
  tin: 'Tin',
  tray: 'Tray',
  tsp: 'tsp',
  tube: 'Tube',
  u: 'U',
  vial: 'Vial',
  wafer: 'Wafer',
} as const;

export const DRUG_UNIT_VALUES = Object.values(DRUG_UNITS);

export type DrugUnit = (typeof DRUG_UNITS)[keyof typeof DRUG_UNITS];

export const DRUG_UNIT_LABELS = Object.values(DRUG_UNITS).reduce(
  (acc, curr) => {
    acc[curr] = curr;
    return acc;
  },
  {} as Record<DrugUnit, DrugUnit>,
);

export const DRUG_UNIT_SHORT_LABELS = {
  [DRUG_UNITS.percentage]: '%',
  [DRUG_UNITS.ampule]: 'Amp',
  [DRUG_UNITS.applicator]: 'Applicator',
  [DRUG_UNITS.bag]: 'Bag',
  [DRUG_UNITS.blisterPack]: 'Blister',
  [DRUG_UNITS.bottle]: 'Bottle',
  [DRUG_UNITS.box]: 'Box',
  [DRUG_UNITS.can]: 'Can',
  [DRUG_UNITS.canister]: 'Canister',
  [DRUG_UNITS.capsule]: 'Cap',
  [DRUG_UNITS.carton]: 'Carton',
  [DRUG_UNITS.cartridge]: 'Cartridge',
  [DRUG_UNITS.disc]: 'Disc',
  [DRUG_UNITS.douche]: 'Dche',
  [DRUG_UNITS.drop]: 'Drop',
  [DRUG_UNITS.each]: 'Each',
  [DRUG_UNITS.ffu]: 'FFU',
  [DRUG_UNITS.g]: 'g',
  [DRUG_UNITS.inhaler]: 'Inhaler',
  [DRUG_UNITS.iu]: 'IU',
  [DRUG_UNITS.jar]: 'Jar',
  [DRUG_UNITS.kit]: 'Kit',
  [DRUG_UNITS.l]: 'L',
  [DRUG_UNITS.lozenge]: 'Loz',
  [DRUG_UNITS.millionUnits]: 'MU',
  [DRUG_UNITS.mg]: 'mg',
  [DRUG_UNITS.mcg]: 'mcg',
  [DRUG_UNITS.ml]: 'mL',
  [DRUG_UNITS.mmol]: 'mmol',
  [DRUG_UNITS.mol]: 'mol',
  [DRUG_UNITS.pack]: 'Pack',
  [DRUG_UNITS.package]: 'Package',
  [DRUG_UNITS.patch]: 'Patch',
  [DRUG_UNITS.pellet]: 'Pellet',
  [DRUG_UNITS.pen]: 'Pen',
  [DRUG_UNITS.pouch]: 'Pouch',
  [DRUG_UNITS.puff]: 'Puff',
  [DRUG_UNITS.ring]: 'Ring',
  [DRUG_UNITS.roll]: 'Roll',
  [DRUG_UNITS.sachet]: 'Sachet',
  [DRUG_UNITS.smear]: 'Smear',
  [DRUG_UNITS.spray]: 'Spray',
  [DRUG_UNITS.stick]: 'Stick',
  [DRUG_UNITS.strip]: 'Strip',
  [DRUG_UNITS.suppository]: 'Supp',
  [DRUG_UNITS.swab]: 'Swab',
  [DRUG_UNITS.syringe]: 'Syringe',
  [DRUG_UNITS.tablet]: 'Tab',
  [DRUG_UNITS.tbsp]: 'tbsp',
  [DRUG_UNITS.tin]: 'Tin',
  [DRUG_UNITS.tray]: 'Tray',
  [DRUG_UNITS.tsp]: 'tsp',
  [DRUG_UNITS.tube]: 'Tube',
  [DRUG_UNITS.u]: 'U',
  [DRUG_UNITS.vial]: 'Vial',
  [DRUG_UNITS.wafer]: 'Wafer',
} as const;

// Long-form unit labels in plural. Used for dispensed-medication label text when
// the dose is greater than 1 (e.g. '2 tablets'). Units of measurement (mg, mL, %,
// etc.) are invariant, so their plural is the same as the singular long form.
export const DRUG_UNIT_PLURAL_LABELS = {
  [DRUG_UNITS.percentage]: '%',
  [DRUG_UNITS.ampule]: 'Ampules',
  [DRUG_UNITS.applicator]: 'Applicators',
  [DRUG_UNITS.bag]: 'Bags',
  [DRUG_UNITS.blisterPack]: 'Blister Packs',
  [DRUG_UNITS.bottle]: 'Bottles',
  [DRUG_UNITS.box]: 'Boxes',
  [DRUG_UNITS.can]: 'Cans',
  [DRUG_UNITS.canister]: 'Canisters',
  [DRUG_UNITS.capsule]: 'Capsules',
  [DRUG_UNITS.carton]: 'Cartons',
  [DRUG_UNITS.cartridge]: 'Cartridges',
  [DRUG_UNITS.disc]: 'Discs',
  [DRUG_UNITS.douche]: 'Douches',
  [DRUG_UNITS.drop]: 'Drops',
  [DRUG_UNITS.each]: 'Each',
  [DRUG_UNITS.ffu]: 'FFU',
  [DRUG_UNITS.g]: 'g',
  [DRUG_UNITS.inhaler]: 'Inhalers',
  [DRUG_UNITS.iu]: 'IU',
  [DRUG_UNITS.jar]: 'Jars',
  [DRUG_UNITS.kit]: 'Kits',
  [DRUG_UNITS.l]: 'L',
  [DRUG_UNITS.lozenge]: 'Lozenges',
  [DRUG_UNITS.millionUnits]: 'Million units',
  [DRUG_UNITS.mg]: 'mg',
  [DRUG_UNITS.mcg]: 'mcg',
  [DRUG_UNITS.ml]: 'mL',
  [DRUG_UNITS.mmol]: 'mmol',
  [DRUG_UNITS.mol]: 'mol',
  [DRUG_UNITS.pack]: 'Packs',
  [DRUG_UNITS.package]: 'Packages',
  [DRUG_UNITS.patch]: 'Patches',
  [DRUG_UNITS.pellet]: 'Pellets',
  [DRUG_UNITS.pen]: 'Pens',
  [DRUG_UNITS.pouch]: 'Pouches',
  [DRUG_UNITS.puff]: 'Puffs',
  [DRUG_UNITS.ring]: 'Rings',
  [DRUG_UNITS.roll]: 'Rolls',
  [DRUG_UNITS.sachet]: 'Sachets',
  [DRUG_UNITS.smear]: 'Smears',
  [DRUG_UNITS.spray]: 'Sprays',
  [DRUG_UNITS.stick]: 'Sticks',
  [DRUG_UNITS.strip]: 'Strips',
  [DRUG_UNITS.suppository]: 'Suppositories',
  [DRUG_UNITS.swab]: 'Swabs',
  [DRUG_UNITS.syringe]: 'Syringes',
  [DRUG_UNITS.tablet]: 'Tablets',
  [DRUG_UNITS.tbsp]: 'tbsp',
  [DRUG_UNITS.tin]: 'Tins',
  [DRUG_UNITS.tray]: 'Trays',
  [DRUG_UNITS.tsp]: 'tsp',
  [DRUG_UNITS.tube]: 'Tubes',
  [DRUG_UNITS.u]: 'U',
  [DRUG_UNITS.vial]: 'Vials',
  [DRUG_UNITS.wafer]: 'Wafers',
} as const;

// Administration verb prefixed to dispensed-medication label text, chosen per
// dosing unit (e.g. 'Take 1 tablet...', 'Apply 1 patch...').
export const DRUG_UNIT_VERBS = {
  [DRUG_UNITS.percentage]: 'Administer',
  [DRUG_UNITS.ampule]: 'Give',
  [DRUG_UNITS.applicator]: 'Insert',
  [DRUG_UNITS.bag]: 'Administer',
  [DRUG_UNITS.blisterPack]: 'Take',
  [DRUG_UNITS.bottle]: 'Take',
  [DRUG_UNITS.box]: 'Take',
  [DRUG_UNITS.can]: 'Take',
  [DRUG_UNITS.canister]: 'Inhale',
  [DRUG_UNITS.capsule]: 'Take',
  [DRUG_UNITS.carton]: 'Take',
  [DRUG_UNITS.cartridge]: 'Administer',
  [DRUG_UNITS.disc]: 'Administer',
  [DRUG_UNITS.douche]: 'Administer',
  [DRUG_UNITS.drop]: 'Administer',
  [DRUG_UNITS.each]: 'Take',
  [DRUG_UNITS.ffu]: 'Administer',
  [DRUG_UNITS.g]: 'Administer',
  [DRUG_UNITS.inhaler]: 'Inhale',
  [DRUG_UNITS.iu]: 'Administer',
  [DRUG_UNITS.jar]: 'Apply',
  [DRUG_UNITS.kit]: 'Administer',
  [DRUG_UNITS.l]: 'Administer',
  [DRUG_UNITS.lozenge]: 'Take',
  [DRUG_UNITS.millionUnits]: 'Give',
  [DRUG_UNITS.mg]: 'Give',
  [DRUG_UNITS.mcg]: 'Give',
  [DRUG_UNITS.ml]: 'Give',
  [DRUG_UNITS.mmol]: 'Give',
  [DRUG_UNITS.mol]: 'Give',
  [DRUG_UNITS.pack]: 'Take',
  [DRUG_UNITS.package]: 'Take',
  [DRUG_UNITS.patch]: 'Apply',
  [DRUG_UNITS.pellet]: 'Administer',
  [DRUG_UNITS.pen]: 'Administer',
  [DRUG_UNITS.pouch]: 'Administer',
  [DRUG_UNITS.puff]: 'Inhale',
  [DRUG_UNITS.ring]: 'Insert',
  [DRUG_UNITS.roll]: 'Apply',
  [DRUG_UNITS.sachet]: 'Take',
  [DRUG_UNITS.smear]: 'Apply',
  [DRUG_UNITS.spray]: 'Administer',
  [DRUG_UNITS.stick]: 'Administer',
  [DRUG_UNITS.strip]: 'Administer',
  [DRUG_UNITS.suppository]: 'Insert',
  [DRUG_UNITS.swab]: 'Apply',
  [DRUG_UNITS.syringe]: 'Administer',
  [DRUG_UNITS.tablet]: 'Take',
  [DRUG_UNITS.tbsp]: 'Give',
  [DRUG_UNITS.tin]: 'Apply',
  [DRUG_UNITS.tray]: 'Take',
  [DRUG_UNITS.tsp]: 'Give',
  [DRUG_UNITS.tube]: 'Apply',
  [DRUG_UNITS.u]: 'Administer',
  [DRUG_UNITS.vial]: 'Give',
  [DRUG_UNITS.wafer]: 'Take',
} as const;

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
} as const;

export type AdministrationFrequency =
  (typeof ADMINISTRATION_FREQUENCIES)[keyof typeof ADMINISTRATION_FREQUENCIES];

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
} as const;

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
    // A month is treated as 30 days (matching MEDICATION_DURATION_UNITS), so a monthly
    // dose over an N-month duration autocalculates to N administrations.
    dosesPerDay: 1 / 30,
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
} as const;

export const MEDICATION_DURATION_UNITS = {
  HOURS: 'hours',
  DAYS: 'days',
  WEEKS: 'weeks',
  MONTHS: 'months',
} as const satisfies Record<string, keyof Duration>;

export const MEDICATION_DURATION_DISPLAY_UNITS_LABELS = {
  [MEDICATION_DURATION_UNITS.HOURS]: 'Hours',
  [MEDICATION_DURATION_UNITS.DAYS]: 'Days',
  [MEDICATION_DURATION_UNITS.WEEKS]: 'Weeks',
  [MEDICATION_DURATION_UNITS.MONTHS]: 'Months',
} as const;

export const MEDICATION_DURATION_UNITS_LABELS = {
  [MEDICATION_DURATION_UNITS.HOURS]: 'hour (s)',
  [MEDICATION_DURATION_UNITS.DAYS]: 'day (s)',
  [MEDICATION_DURATION_UNITS.WEEKS]: 'week (s)',
  [MEDICATION_DURATION_UNITS.MONTHS]: 'month (s)',
} as const;

export const MEDICATION_PAUSE_DURATION_UNITS_LABELS = {
  [MEDICATION_DURATION_UNITS.HOURS]: 'hour (s)',
  [MEDICATION_DURATION_UNITS.DAYS]: 'day (s)',
} as const;

export const ADMINISTRATION_STATUS = {
  GIVEN: 'given',
  NOT_GIVEN: 'not-given',
} as const;

export const ADMINISTRATION_STATUS_LABELS = {
  [ADMINISTRATION_STATUS.GIVEN]: 'Given',
  [ADMINISTRATION_STATUS.NOT_GIVEN]: 'Not given',
} as const;

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
] as const;

export type MedicationAdministrationTimeSlot =
  (typeof MEDICATION_ADMINISTRATION_TIME_SLOTS)[number];

export const PHARMACY_PRESCRIPTION_TYPES = {
  DISCHARGE_OR_OUTPATIENT: 'DISCHARGE_OR_OUTPATIENT',
  INPATIENT: 'INPATIENT',
} as const;

export const PHARMACY_PRESCRIPTION_TYPE_LABELS = {
  [PHARMACY_PRESCRIPTION_TYPES.INPATIENT]: 'Inpatient',
  [PHARMACY_PRESCRIPTION_TYPES.DISCHARGE_OR_OUTPATIENT]: 'Outpatient/Discharge',
} as const;

export const PHARMACY_ORDER_DEFAULT_PRESCRIPTION_MODES = {
  ENCOUNTER_TYPE: 'encounterType',
  OUTPATIENT_OR_DISCHARGE: 'outpatientOrDischarge',
  INPATIENT: 'inpatient',
} as const;

export const DRUG_STOCK_STATUSES = {
  IN_STOCK: 'in_stock',
  OUT_OF_STOCK: 'out_of_stock',
  UNAVAILABLE: 'unavailable',
  UNKNOWN: 'unknown',
} as const;

export const DRUG_STOCK_STATUS_LABELS = {
  [DRUG_STOCK_STATUSES.IN_STOCK]: 'Yes',
  [DRUG_STOCK_STATUSES.OUT_OF_STOCK]: 'No',
  [DRUG_STOCK_STATUSES.UNKNOWN]: 'Unknown',
} as const;

export const INVOICEABLE_MEDICATION_ENCOUNTER_TYPES = [
  ENCOUNTER_TYPES.ADMISSION,
  ENCOUNTER_TYPES.TRIAGE,
  ENCOUNTER_TYPES.OBSERVATION,
  ENCOUNTER_TYPES.EMERGENCY,
] as const;
