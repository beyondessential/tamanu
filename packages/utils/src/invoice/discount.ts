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
 * Get the discount amount of an invoice discount
 */
export const getInvoiceLevelDiscountAmount = (
  discount: InvoiceDiscount | undefined,
  total: number,
): number => {
  return getDiscountAmount(total || 0, discount?.percentage || 0);
};
