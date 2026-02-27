import Decimal from 'decimal.js';

/**
 * get a discounted price
 * @param {number} price
 * @param {number} percentDiscount
 */
export const getDiscountAmount = (price, percentDiscount) => {
  return new Decimal(price).times(percentDiscount).toNumber();
};

/**
 * get a price after applying a discount
 * @param {number} price
 * @param {number} percentDiscount
 * @returns {number}
 */
export const getDiscountedPrice = (price, percentDiscount) => {
  return new Decimal(price).minus(getDiscountAmount(price, percentDiscount)).toNumber();
};

/**
 * Get the discount amount of an invoice discount
 * @param {InvoiceDiscount} discount
 * @param {number} total
 */
export const getInvoiceLevelDiscountAmount = (discount, total) => {
  return getDiscountAmount(total || 0, discount?.percentage || 0);
};
