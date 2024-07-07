import { SEX_LABELS } from './patientFields';
import {
  INVOICE_LINE_TYPE_LABELS,
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_PRICE_CHANGE_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
} from './invoices';
import { NOTE_TYPE_LABELS } from './notes';
import {
  REFERRAL_STATUS_LABELS,
  APPOINTMENT_TYPES,
  APPOINTMENT_STATUSES,
  IMAGING_REQUEST_STATUS_LABELS,
} from './statuses';
import { VACCINE_STATUS_LABELS, INJECTION_SITE_LABELS, VACCINE_CATEGORIES } from './vaccines';
import { BIRTH_TYPE_LABELS } from './births';
import { IMAGING_TYPES } from './imaging';
import {
  REPORT_DATA_SOURCE_LABELS,
  REPORT_DATE_RANGE_LABELS,
  REPORT_DB_SCHEMA_LABELS,
} from './reports';
import { TEMPLATE_TYPE_LABELS } from './templates';
import { LAB_REQUEST_STATUS_LABELS } from './labs';
import { ASSET_NAMES } from './importable';
import { DIAGNOSIS_CERTAINTY_LABELS, PATIENT_ISSUE_LABELS } from './diagnoses';
import { DRUG_ROUTE_LABELS, REPEATS_LABELS } from './medications';
import { PLACE_OF_DEATHS } from './deaths';
import { LOCATION_AVAILABILITY_STATUS_LABELS } from './locations';

// This is a group of all the enums that are registered to be translatable.
// This allows us to keep track of changes to existing enums or the additional
// of new enum constants when maintaining translations
export const registeredEnums = {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  ASSET_NAMES,
  BIRTH_TYPE_LABELS,
  DIAGNOSIS_CERTAINTY_LABELS,
  DRUG_ROUTE_LABELS,
  IMAGING_REQUEST_STATUS_LABELS,
  IMAGING_TYPES,
  INJECTION_SITE_LABELS,
  INVOICE_LINE_TYPE_LABELS,
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_PRICE_CHANGE_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
  LAB_REQUEST_STATUS_LABELS,
  LOCATION_AVAILABILITY_STATUS_LABELS,
  NOTE_TYPE_LABELS,
  PATIENT_ISSUE_LABELS,
  PLACE_OF_DEATHS,
  REFERRAL_STATUS_LABELS,
  REPEATS_LABELS,
  REPORT_DATA_SOURCE_LABELS,
  REPORT_DATE_RANGE_LABELS,
  REPORT_DB_SCHEMA_LABELS,
  SEX_LABELS,
  TEMPLATE_TYPE_LABELS,
  VACCINE_CATEGORIES,
  VACCINE_STATUS_LABELS,
};

const enumRegistry = new Set(Object.values(registeredEnums));

// Used to enforce usage of translatable enums
// recognises registered enums from object references
export const isRegisteredEnum = (value: any): boolean => enumRegistry.has(value);
