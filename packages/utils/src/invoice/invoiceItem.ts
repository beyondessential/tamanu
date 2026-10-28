import Decimal from 'decimal.js';
import { INVOICE_ITEMS_CATEGORIES, INVOICE_ITEMS_DISCOUNT_TYPES } from '@tamanu/constants';
import { getDiscountedPrice } from './discount';
import { roundToCents } from './money';
import type { InvoiceItem, InsurancePlanItem } from './types';

/**
 * Get the unit price of an invoice item
 */
export const getInvoiceItemPrice = (invoiceItem: InvoiceItem): number => {
  return (
    invoiceItem.priceFinal ??
    invoiceItem.manualEntryPrice ??
    invoiceItem?.product?.invoicePriceListItem?.price ??
    0 // handle missing price as 0
  );
};

/**
 * Whether a product is configured for fixed pricing on its price-list item. Fixed pricing is
 * only honoured for medications in v1.
 */
export const isFixedPriceProduct = (product: InvoiceItem['product']): boolean =>
  product?.category === INVOICE_ITEMS_CATEGORIES.DRUG &&
  Boolean(product?.invoicePriceListItem?.isFixedPrice);

/**
 * Once finalised the snapshotted `isFixedPriceFinal` is authoritative in both directions, so a
 * later price-list change can't retroactively flip a finalised line.
 */
export const isFixedPriceItem = (invoiceItem: InvoiceItem): boolean => {
  if (invoiceItem.priceFinal != null) return Boolean(invoiceItem.isFixedPriceFinal);
  return isFixedPriceProduct(invoiceItem.product);
};

/**
 * Get the price of an invoice item row, rounded to the cent
 */
export const getInvoiceItemTotalPrice = (invoiceItem: InvoiceItem): number => {
  const price = getInvoiceItemPrice(invoiceItem) || 0;
  const quantity = isFixedPriceItem(invoiceItem) ? 1 : (invoiceItem.quantity ?? 0);
  return roundToCents(new Decimal(price).times(quantity)).toNumber();
};

/**
 * Get the price of an invoice item after applying the discount, rounded to the cent
 */
export const getInvoiceItemTotalDiscountedPrice = (invoiceItem: InvoiceItem): number => {
  const invoiceItemTotalPrice = getInvoiceItemTotalPrice(invoiceItem);
  if (!invoiceItem.discount) return invoiceItemTotalPrice;
  if (invoiceItem.discount.type === INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE) {
    return roundToCents(
      getDiscountedPrice(invoiceItemTotalPrice, invoiceItem?.discount?.amount || 0),
    ).toNumber();
  }
  return roundToCents(
    new Decimal(invoiceItemTotalPrice).minus(invoiceItem?.discount?.amount || 0),
  ).toNumber();
};

/**
 * Calculate the item adjustment amount (difference between original and discounted price)
 * Returns a negative number for discounts, positive for markups
 */
export const getItemAdjustmentAmount = (item: InvoiceItem): number =>
  calculateInvoiceItem(item).adjustment;

/**
 * Check if an item has any adjustment (markup or discount)
 */
export const hasItemAdjustment = (item: InvoiceItem): boolean => {
  return getItemAdjustmentAmount(item) !== 0;
};

export interface InvoiceItemPlanCoverage {
  insurancePlanId: string;
  /** The coverage percentage applied: the finalised snapshot where there is one, else the plan's */
  percentage: number;
  /** This plan's share of the line, before the line's coverage is capped */
  coverage: number;
}

export interface InvoiceItemPricing {
  totalPrice: number;
  discountedPrice: number;
  /** Discounted price minus total price: negative for a discount, positive for a markup */
  adjustment: number;
  coverageByPlan: InvoiceItemPlanCoverage[];
  /**
   * Insurance coverage of the line, capped at its discounted price. An insurable line with an
   * empty plan list has none here, though the invoice total still caps it (see `calculateInvoice`)
   */
  insuranceCoverage: number;
  netCost: number;
}

/**
 * Each plan's coverage of a line. Only lines whose product is explicitly insurable are covered.
 */
export const getInvoiceItemPlanCoverages = (
  item: InvoiceItem,
  discountedPrice: number,
): InvoiceItemPlanCoverage[] => {
  if (!item?.product?.insurable || !item.insurancePlanItems) {
    return [];
  }
  return item.insurancePlanItems.map(insurancePlanItem => ({
    insurancePlanId: insurancePlanItem.id,
    percentage: getInvoiceItemCoveragePercentage(item, insurancePlanItem),
    coverage: getItemSingleInsuranceCoverageAmount(discountedPrice, item, insurancePlanItem),
  }));
};

/**
 * The total of the plans' coverage of a line, capped at the line's discounted price so that
 * overlapping plans can never cover more than the line costs.
 */
export const capInsuranceCoverage = (
  coverageByPlan: InvoiceItemPlanCoverage[],
  discountedPrice: number,
): Decimal => {
  const totalCoverage = coverageByPlan.reduce(
    (sum, planCoverage) => sum.plus(planCoverage.coverage),
    new Decimal(0),
  );
  return totalCoverage.toNumber() > discountedPrice ? new Decimal(discountedPrice) : totalCoverage;
};

/**
 * Every figure derived from a single invoice line. This is the one place a line is priced; the
 * per-figure helpers below and the invoice-level calculation all read from it.
 */
export const calculateInvoiceItem = (item: InvoiceItem): InvoiceItemPricing => {
  const totalPrice = getInvoiceItemTotalPrice(item) || 0;
  const discountedPrice = getInvoiceItemTotalDiscountedPrice(item) || 0;
  const coverageByPlan = getInvoiceItemPlanCoverages(item, discountedPrice).map(planCoverage => ({
    ...planCoverage,
    coverage: roundToCents(planCoverage.coverage).toNumber(),
  }));
  // Cap the plans' unrounded coverage, then round, so the line is rounded once
  const insuranceCoverage =
    coverageByPlan.length > 0
      ? roundToCents(
          capInsuranceCoverage(getInvoiceItemPlanCoverages(item, discountedPrice), discountedPrice),
        ).toNumber()
      : 0;

  return {
    totalPrice,
    discountedPrice,
    adjustment: new Decimal(discountedPrice).minus(totalPrice).toNumber(),
    coverageByPlan,
    insuranceCoverage,
    netCost: new Decimal(discountedPrice).minus(insuranceCoverage).toNumber(),
  };
};

/**
 * Calculate the total insurance coverage amount (from all insurance plans) for an invoice item
 * @returns {number} - The total insurance coverage amount for the item
 */
export const getItemTotalInsuranceCoverageAmount = (item: InvoiceItem): number =>
  calculateInvoiceItem(item).insuranceCoverage;

/**
 * Calculate the insurance coverage amount for a single insurance plan item
 * @param {number} discountedPrice - The discounted price of the item
 * @param {InvoiceItem} item - The invoice item object
 * @param {InsurancePlanItem} insurancePlanItem - The insurance plan item object
 * @returns {number} - The insurance coverage amount for the item
 */
export const getItemSingleInsuranceCoverageAmount = (
  discountedPrice: number,
  item: InvoiceItem,
  insurancePlanItem: InsurancePlanItem,
): number => {
  const appliedCoverage = getInvoiceItemCoveragePercentage(item, insurancePlanItem);
  return new Decimal(discountedPrice).times(appliedCoverage / 100).toNumber();
};

/**
 * Calculate the net cost of an invoice item for display in printout
 * @param {InvoiceItem} item - The invoice item object
 * @returns {number} - The net cost of the item
 */
export const getInvoiceItemNetCost = (item: InvoiceItem): number =>
  calculateInvoiceItem(item).netCost;

/**
 * Get the display coverage value for an insurance plan item, taking into account finalisedInsurances
 * @param {InvoiceItem} item - The invoice item containing finalisedInsurances
 * @param {InsurancePlanItem} insurancePlanItem - The insurance plan item
 * @returns {number} - The coverage value to display (either finalised or default)
 */
export const getInvoiceItemCoveragePercentage = (
  item: InvoiceItem,
  insurancePlanItem: InsurancePlanItem,
): number => {
  const planCoverageValue = insurancePlanItem.coverageValue ?? 0;

  if (!item.finalisedInsurances || item.finalisedInsurances.length === 0) {
    return planCoverageValue;
  }

  const finalisedInsurance = item.finalisedInsurances.find(
    ins => ins.invoiceInsurancePlanId === insurancePlanItem.id,
  );

  return finalisedInsurance ? finalisedInsurance.coverageValueFinal : planCoverageValue;
};
