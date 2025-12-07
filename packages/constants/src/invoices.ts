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
};

export const INVOICE_PRODUCT_REFERENCE_DATA_TYPE_CATEGORIES = {
  [REFERENCE_TYPES.PROCEDURE_TYPE]: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
  [REFERENCE_TYPES.IMAGING_TYPE]: INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE,
  [REFERENCE_TYPES.DRUG]: INVOICE_ITEMS_CATEGORIES.DRUG,
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
};

export const INVOICE_ITEMS_CATEGORY_LABELS = {
  [INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE]: 'Procedure type',
  [INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE]: 'Imaging type',
  [INVOICE_ITEMS_CATEGORIES.IMAGING_AREA]: 'Imaging area',
  [INVOICE_ITEMS_CATEGORIES.DRUG]: 'Drug',
  [INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE]: 'Lab test type',
  [INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL]: 'Lab test panel',
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
