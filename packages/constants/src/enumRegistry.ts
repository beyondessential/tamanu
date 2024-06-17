import { SEX_VALUES } from './patientFields';
import { INVOICE_LINE_TYPE_LABELS, INVOICE_PRICE_CHANGE_TYPE_LABELS } from './invoices';
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

// This is a set of all the enums that are registered to be translatable.
// This allows us to keep track of changes to existing enums or the additional
// of new enum constants when maintaining translations
export const enumRegistry = new Set([
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  BIRTH_TYPE_LABELS,
  IMAGING_REQUEST_STATUS_LABELS,
  IMAGING_TYPES,
  INJECTION_SITE_LABELS,
  INVOICE_LINE_TYPE_LABELS,
  INVOICE_PRICE_CHANGE_TYPE_LABELS,
  NOTE_TYPE_LABELS,
  REFERRAL_STATUS_LABELS,
  REPORT_DATA_SOURCE_LABELS,
  REPORT_DATE_RANGE_LABELS,
  REPORT_DB_SCHEMA_LABELS,
  SEX_VALUES,
  TEMPLATE_TYPE_LABELS,
  VACCINE_CATEGORIES,
  VACCINE_STATUS_LABELS,
]);
