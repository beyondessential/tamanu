import { SEX_VALUES } from './patientFields';
import { INVOICE_LINE_TYPE_LABELS, INVOICE_PRICE_CHANGE_TYPE_LABELS } from './invoices';
import { NOTE_TYPE_LABELS } from './notes';
import { REFERRAL_STATUS_LABELS } from './statuses';
import { VACCINE_STATUS_LABELS } from './vaccines';

// This is a set of all the enums that are registered to be translatable.
// This allows us to keep track of changes to existing enums or the additional
// of new enum constants when maintaining translations
export const enumRegistry = new Set([
  SEX_VALUES,
  INVOICE_LINE_TYPE_LABELS,
  INVOICE_PRICE_CHANGE_TYPE_LABELS,
  NOTE_TYPE_LABELS,
  REFERRAL_STATUS_LABELS,
  VACCINE_STATUS_LABELS,
]);
