import Decimal from 'decimal.js';
import type { InvoiceDiscount } from './types';

/**
 * get a discounted price
 */
export const getDiscountAmount = (price: number, percentDiscount: number): number => {
  return new Decimal(price).times(percentDiscount).toNumber();
};

/**
 * get a price after applying a discount
 */
export const getDiscountedPrice = (price: number, percentDiscount: number): number => {
  return new Decimal(price).minus(getDiscountAmount(price, percentDiscount)).toNumber();
};

/**
 * Which reason explains an invoice-level discount, if any.
 *
 * A manual discount carries the reason the cashier typed. A sliding fee scale discount is derived
 * from the patient assessment and records no free text, so it is reported as `assessment` for the
 * caller to label in whichever way suits its surface. A manual discount saved without a reason has
 * nothing to show.
 *
 * Callers render the label themselves rather than receiving one, so the web app and the printed
 * invoice can share this rule without this module depending on either's translation machinery.
 */
export const getInvoiceDiscountReason = (
  discount: InvoiceDiscount | undefined | null,
): { kind: 'recorded'; text: string } | { kind: 'assessment' } | null => {
  if (!discount?.percentage) return null;
  if (discount.reason) return { kind: 'recorded', text: discount.reason };
  return discount.isManual ? null : { kind: 'assessment' };
};

/**
 * Get the discount amount of an invoice discount
 */
export const getInvoiceLevelDiscountAmount = (
  discount: InvoiceDiscount | undefined,
  total: number,
): number => {
  return getDiscountAmount(total || 0, discount?.percentage || 0);
};
