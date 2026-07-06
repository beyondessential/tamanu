import { ENCOUNTER_TYPES, EncounterType } from './encounters';
import { IMAGING_AREA_TYPES } from './imaging';
import { REFERENCE_TYPES } from './importable';

export const INVOICE_STATUSES = {
  CANCELLED: 'cancelled',
  IN_PROGRESS: 'in_progress',
  FINALISED: 'finalised',
};

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUSES.CANCELLED]: 'Cancelled',
  [INVOICE_STATUSES.IN_PROGRESS]: 'In progress',
  [INVOICE_STATUSES.FINALISED]: 'Finalised',
};
export const INVOICE_PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  PARTIAL: 'partial',
  REJECTED: 'rejected',
  PAID_REJECTED: 'paid/rejected',
};

export const INVOICE_ITEMS_CATEGORIES = {
  PROCEDURE_TYPE: 'ProcedureType',
  IMAGING_TYPE: 'ImagingType',
  IMAGING_AREA: 'ImagingArea',
  DRUG: 'Drug',
  LAB_TEST_TYPE: 'LabTestType',
  LAB_TEST_PANEL: 'LabTestPanel',
  ENCOUNTER_FEE: 'EncounterFee',
  PHARMACY_ENCOUNTER_FEE: 'PharmacyEncounterFee',
  BED_FEE: 'BedFee',
};

// Stable reference-data codes for the clinic/ED encounter-fee products. A data admin imports
// `encounterFee` reference data with these codes and prices them per facility via price lists.
// Outpatient (clinic) and emergency (ED) encounters each resolve to a standard / after-hours /
// weekend bucket, evaluated against their own facility hours window; the weekend product is
// optional and falls back to the matching after-hours product where a state doesn't distinguish
// them.
export const ENCOUNTER_FEE_CODES = {
  STANDARD: 'encounterFeeStandard',
  AFTER_HOURS: 'encounterFeeAfterHours',
  WEEKEND: 'encounterFeeWeekend',
  EMERGENCY_STANDARD: 'encounterFeeEmergencyStandard',
  EMERGENCY_AFTER_HOURS: 'encounterFeeEmergencyAfterHours',
  EMERGENCY_WEEKEND: 'encounterFeeEmergencyWeekend',
};

// A walk-in pharmacy dispensing encounter charges its own flat fee, separate from the clinic
// fees above. It is priced on the same facility price list; a facility that doesn't charge for
// pharmacy simply leaves this product unpriced (no price-list item → no fee line).
export const PHARMACY_ENCOUNTER_FEE_CODE = 'encounterFeePharmacy';

// Clinical-item categories that a facility can bundle into the inpatient admission fee
// (so they don't auto-add for admission encounters). Procedures are never bundled.
export const INPATIENT_BUNDLED_CATEGORIES = {
  IMAGING: 'imaging',
  LAB: 'lab',
  MEDICATION: 'medication',
} as const;
export const INPATIENT_BUNDLED_CATEGORY_VALUES = Object.values(INPATIENT_BUNDLED_CATEGORIES);
export type InpatientBundledCategory =
  (typeof INPATIENT_BUNDLED_CATEGORIES)[keyof typeof INPATIENT_BUNDLED_CATEGORIES];

export const INVOICE_PRODUCT_REFERENCE_DATA_TYPE_CATEGORIES = {
  [REFERENCE_TYPES.PROCEDURE_TYPE]: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
  [REFERENCE_TYPES.IMAGING_TYPE]: INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE,
  [REFERENCE_TYPES.DRUG]: INVOICE_ITEMS_CATEGORIES.DRUG,
  [REFERENCE_TYPES.ENCOUNTER_FEE]: INVOICE_ITEMS_CATEGORIES.ENCOUNTER_FEE,
  [REFERENCE_TYPES.PHARMACY_ENCOUNTER_FEE]: INVOICE_ITEMS_CATEGORIES.PHARMACY_ENCOUNTER_FEE,
};

// All imaging area reference data types are mapped to the ImagingArea category
for (const areaType of Object.values(IMAGING_AREA_TYPES)) {
  INVOICE_PRODUCT_REFERENCE_DATA_TYPE_CATEGORIES[areaType] = INVOICE_ITEMS_CATEGORIES.IMAGING_AREA;
}

// A map from the item category and its underlying model name
export const INVOICE_ITEMS_CATEGORIES_MODELS = {
  [INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE]: 'ReferenceData',
  [INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE]: 'ReferenceData', // Note this reference data is not currently being used in the Imaging module (see TAMP-126)
  [INVOICE_ITEMS_CATEGORIES.IMAGING_AREA]: 'ReferenceData',
  [INVOICE_ITEMS_CATEGORIES.DRUG]: 'ReferenceData',
  [INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE]: 'LabTestType',
  [INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL]: 'LabTestPanel',
  [INVOICE_ITEMS_CATEGORIES.ENCOUNTER_FEE]: 'ReferenceData',
  [INVOICE_ITEMS_CATEGORIES.PHARMACY_ENCOUNTER_FEE]: 'ReferenceData',
  [INVOICE_ITEMS_CATEGORIES.BED_FEE]: 'Location',
};

export const INVOICE_ITEMS_CATEGORY_LABELS = {
  [INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE]: 'Procedure type',
  [INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE]: 'Imaging type',
  [INVOICE_ITEMS_CATEGORIES.IMAGING_AREA]: 'Imaging area',
  [INVOICE_ITEMS_CATEGORIES.DRUG]: 'Drug',
  [INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE]: 'Lab test type',
  [INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL]: 'Lab test panel',
  [INVOICE_ITEMS_CATEGORIES.ENCOUNTER_FEE]: 'Encounter fee',
  [INVOICE_ITEMS_CATEGORIES.PHARMACY_ENCOUNTER_FEE]: 'Pharmacy encounter fee',
  [INVOICE_ITEMS_CATEGORIES.BED_FEE]: 'Bed fee',
};

export const INVOICE_ITEMS_DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  AMOUNT: 'amount',
};

export const INVOICE_PATIENT_PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  PARTIAL: 'partial',
};

export const INVOICE_INSURER_PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  PARTIAL: 'partial',
  REJECTED: 'rejected',
};

export const INVOICE_PATIENT_PAYMENT_STATUSES_LABELS = {
  [INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID]: 'Unpaid',
  [INVOICE_PATIENT_PAYMENT_STATUSES.PAID]: 'Paid',
  [INVOICE_PATIENT_PAYMENT_STATUSES.PARTIAL]: 'Partial',
};

export const INVOICE_INSURER_PAYMENT_STATUS_LABELS = {
  [INVOICE_INSURER_PAYMENT_STATUSES.UNPAID]: 'Unpaid',
  [INVOICE_INSURER_PAYMENT_STATUSES.PAID]: 'Paid',
  [INVOICE_INSURER_PAYMENT_STATUSES.PARTIAL]: 'Partial',
  [INVOICE_INSURER_PAYMENT_STATUSES.REJECTED]: 'Rejected',
};

export const INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES = {
  HIDDEN: 'hidden',
};

// Charging type per (product × price list), imported via the dedicated
// "Invoice Price List Charging" sheet. flatFee → isFixedPrice true; perUnit → false.
export const INVOICE_PRICE_LIST_CHARGING_VALUES = {
  FLAT_FEE: 'flatFee',
  PER_UNIT: 'perUnit',
};

export const AUTOMATIC_INVOICE_CREATION_EXCLUDED_ENCOUNTER_TYPES: string[] = [
  ENCOUNTER_TYPES.SURVEY_RESPONSE,
  ENCOUNTER_TYPES.VACCINATION,
] satisfies EncounterType[];
