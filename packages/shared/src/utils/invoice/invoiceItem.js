import Decimal from 'decimal.js';
import { INVOICE_ITEMS_DISCOUNT_TYPES } from '@tamanu/constants';
import { getDiscountedPrice } from './discount';

/**
 * Get the unit price of an invoice item
 * @param {InvoiceItem} invoiceItem
 * @returns {number}
 */
export const getInvoiceItemPrice = invoiceItem => {
  return (
    invoiceItem.priceFinal ??
    invoiceItem.manualEntryPrice ??
    invoiceItem?.product?.invoicePriceListItem?.price ??
    0 // handle missing price as 0
  );
};

/**
 * Get the price of an invoice item row
 * @param {InvoiceItem} invoiceItem
 */
export const getInvoiceItemTotalPrice = invoiceItem => {
  const price = getInvoiceItemPrice(invoiceItem) || 0;
  const quantity = invoiceItem.quantity || 0;
  return new Decimal(price).times(quantity).toNumber();
};

/**
 * Get the price of an invoice item after applying the discount
 * @param {InvoiceItem} invoiceItem
 */
export const getInvoiceItemTotalDiscountedPrice = invoiceItem => {
  const invoiceItemTotalPrice = getInvoiceItemTotalPrice(invoiceItem);
  if (!invoiceItem.discount) return invoiceItemTotalPrice;
  if (invoiceItem.discount.type === INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE) {
    return getDiscountedPrice(invoiceItemTotalPrice, invoiceItem?.discount?.amount || 0);
  }
  return invoiceItemTotalPrice - (invoiceItem?.discount?.amount || 0);
};

/**
 * Calculate the item adjustment amount (difference between original and discounted price)
 * Returns a negative number for discounts, positive for markups
 */
export const getItemAdjustmentAmount = item => {
  const originalPrice = getInvoiceItemTotalPrice(item) || 0;
  const discountedPrice = getInvoiceItemTotalDiscountedPrice(item) || 0;
  return new Decimal(discountedPrice).minus(originalPrice).toNumber();
};

/**
 * Check if an item has any adjustment (markup or discount)
 */
export const hasItemAdjustment = item => {
  return getItemAdjustmentAmount(item) !== 0;
};

/**
 * Calculate the total insurance coverage amount (from all insurance plans) for an invoice item
 * @param {InvoiceItem} item
 * @returns {number} - The total insurance coverage amount for the item
 */
export const getItemTotalInsuranceCoverageAmount = item => {
  if (!item?.product?.insurable || !item.insurancePlanItems?.length) {
    return 0;
  }

  const discountedPrice = getInvoiceItemTotalDiscountedPrice(item) || 0;
  const totalCoverage = item.insurancePlanItems.reduce((sum, insurancePlanItem) => {
    const coverageForRow = getItemSingleInsuranceCoverageAmount(
      discountedPrice,
      item,
      insurancePlanItem,
    );
    return sum.plus(coverageForRow);
  }, new Decimal(0));

  // Cap coverage at the discounted price
  return Math.min(totalCoverage, discountedPrice);
};

/**
 * Calculate the insurance coverage amount for a single insurance plan item
 * @param {number} discountedPrice - The discounted price of the item
 * @param {InvoiceItem} item - The invoice item object
 * @param {InsurancePlanItem} insurancePlanItem - The insurance plan item object
 * @returns {number} - The insurance coverage amount for the item
 */
export const getItemSingleInsuranceCoverageAmount = (discountedPrice, item, insurancePlanItem) => {
  const appliedCoverage = getInvoiceItemCoveragePercentage(item, insurancePlanItem);
  return new Decimal(discountedPrice).times(appliedCoverage / 100).toNumber();
};

/**
 * Calculate the net cost of an invoice item for display in printout
 * @param {InvoiceItem} item - The invoice item object
 * @returns {number} - The net cost of the item
 */
export const getInvoiceItemNetCost = item => {
  const discountedPrice = getInvoiceItemTotalDiscountedPrice(item) || 0;
  const insuranceCoverage = getItemTotalInsuranceCoverageAmount(item);
  return new Decimal(discountedPrice).minus(insuranceCoverage).toNumber();
};

/**
 * Get the display coverage value for an insurance plan item, taking into account finalisedInsurances
 * @param {InvoiceItem} item - The invoice item containing finalisedInsurances
 * @param {InsurancePlanItem} insurancePlanItem - The insurance plan item
 * @returns {number} - The coverage value to display (either finalised or default)
 */
export const getInvoiceItemCoveragePercentage = (item, insurancePlanItem) => {
  const planCoverageValue = insurancePlanItem.coverageValue ?? 0;

  if (!item.finalisedInsurances || item.finalisedInsurances.length === 0) {
    return planCoverageValue;
  }

  const finalisedInsurance = item.finalisedInsurances.find(
    ins => ins.invoiceInsurancePlanId === insurancePlanItem.id,
  );

  return finalisedInsurance ? finalisedInsurance.coverageValueFinal : planCoverageValue;
};
