import Decimal from 'decimal.js';
import { INVOICE_ITEMS_DISCOUNT_TYPES, INVOICE_STATUSES } from '@tamanu/constants';
import { formatDisplayPrice } from './display';

/** @typedef {import('@tamanu/database/models').Invoice} Invoice */
/** @typedef {import('@tamanu/database/models').InvoiceDiscount} InvoiceDiscount */
/** @typedef {import('@tamanu/database/models').InvoiceInsurer} InvoiceInsurer */
/** @typedef {import('@tamanu/database/models').InvoiceItem} InvoiceItem */

export const isInvoiceEditable = invoice => invoice.status === INVOICE_STATUSES.IN_PROGRESS;

/**
 * get a price after applying a discount
 * @param {number} price
 * @param {number} discount
 * @returns {number}
 */
const discountedPrice = (price, discount) => {
  return new Decimal(price).minus(discountAmount(price, discount)).toNumber();
};

/**
 * get a discounted price
 * @param {number} price
 * @param {number} discount
 */
const discountAmount = (price, discount) => {
  return new Decimal(price).times(discount).toNumber();
};

/**
 * Get the price of an invoice item
 * @param {InvoiceItem} invoiceItem
 * @returns {string|number|null}
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
    return discountedPrice(invoiceItemTotalPrice, invoiceItem?.discount?.amount || 0);
  }
  return invoiceItemTotalPrice - (invoiceItem?.discount?.amount || 0);
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

/**
 * Calculates the total insurance coverage for a list of invoice items.
 *
 * The function iterates through the provided `invoiceItems`, calculates
 * the discounted price for each item, and determines the total insurance
 * coverage based on each item's associated insurance plans. Each coverage
 * value is capped at the item's discounted price to ensure it does not exceed
 * the discounted amount.
 *
 * @param {Array<InvoiceItem>} invoiceItems - Array of invoice item objects
 * @returns {Decimal} - The total insurance coverage for all invoice items
 */
export const getInsuranceCoverageTotalAmount = invoiceItems => {
  return invoiceItems.reduce((sum, item) => {
    const discountedPrice = getInvoiceItemTotalDiscountedPrice(item) || 0;

    // Apply insurance coverage only to items whose product is explicitly insurable
    if (!item?.product?.insurable || !item.insurancePlanItems) {
      return sum;
    }

    const totalItemInsurance = item.insurancePlanItems.reduce((itemSum, itemPlan) => {
      const coverageForRow = getItemSingleInsuranceCoverageAmount(discountedPrice, item, itemPlan);
      return itemSum.plus(coverageForRow);
    }, new Decimal(0));

    const cappedItemInsurance =
      totalItemInsurance > discountedPrice ? discountedPrice : totalItemInsurance;
    return sum.plus(cappedItemInsurance);
  }, new Decimal(0));
};

/**
 * Get the discount amount of an invoice discount
 * @param {InvoiceDiscount} discount
 * @param {number} total
 */
const getInvoiceDiscountDiscountAmount = (discount, total) => {
  return discountAmount(total || 0, discount?.percentage || 0);
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
 * Calculate and format the insurance coverage of an invoice item for display in printout
 * @param {InvoiceItem} item - The invoice item object
 * @returns {string} - The formatted insurance coverage of the item (e.g., "0.00")
 */
export const getFormattedInvoiceItemCoverageAmount = item => {
  if (!item?.product?.insurable || !item.insurancePlanItems?.length) {
    return formatDisplayPrice(0);
  }
  const coverage = getItemTotalInsuranceCoverageAmount(item);
  return formatDisplayPrice(-coverage);
};

/**
 * Calculate and format the net cost of an invoice item for display in printout
 * @param {InvoiceItem} item - The invoice item object
 * @returns {string|number|null} - The net cost of the item
 */
export const getFormattedInvoiceItemNetCost = item => {
  const discountedPrice = getInvoiceItemTotalDiscountedPrice(item) || 0;
  const insuranceCoverage = getItemTotalInsuranceCoverageAmount(item);
  const netCost = new Decimal(discountedPrice).minus(insuranceCoverage).toNumber();
  return formatDisplayPrice(netCost);
};

// TODO: this is similar to getInsuranceCoverageTotalAmount and could be combined together
/**
 * Calculate and format the total coverage amount for each insurance plan across all invoice items for display in printout
 * @param {Invoice} invoice - The invoice object with items and insurancePlans
 * @returns {Array<{id: string, name: string, code: string, totalCoverage: number}>}
 */
export const getFormattedCoverageAmountPerInsurancePlanForInvoice = invoice => {
  const insurancePlans = invoice.insurancePlans || [];
  const items = invoice.items || [];
  const planCoverageTotals = new Map(insurancePlans.map(p => [p.id, new Decimal(0)]));

  for (const item of items) {
    if (!item?.product?.insurable || !item.insurancePlanItems?.length) {
      continue;
    }

    const discountedPrice = getInvoiceItemTotalDiscountedPrice(item) || 0;
    for (const planItem of item.insurancePlanItems) {
      if (planCoverageTotals.has(planItem.id)) {
        const coverageAmount = getItemSingleInsuranceCoverageAmount(
          discountedPrice,
          item,
          planItem,
        );
        planCoverageTotals.set(
          planItem.id,
          planCoverageTotals.get(planItem.id).plus(coverageAmount),
        );
      }
    }
  }

  return insurancePlans.map(plan => {
    const totalCoverage = planCoverageTotals.get(plan.id);
    return {
      id: plan.id,
      name: plan.name,
      code: plan.code,
      totalCoverage: formatDisplayPrice(totalCoverage.negated()),
    };
  });
};

// TODO: This could be refactored to use getFormattedInvoiceItemNetCost
/**
 * Get the summary of an invoice
 * @param {Invoice} invoice
 * @returns
 */
export const getInvoiceSummary = invoice => {
  invoice = JSON.parse(JSON.stringify(invoice)); // deep clone to convert sequelize entity to plain objects

  const invoiceItemsTotal = invoice.items.reduce(
    (sum, item) => sum.plus(getInvoiceItemTotalDiscountedPrice(item) || 0),
    new Decimal(0),
  );

  const insuranceCoverageTotal = getInsuranceCoverageTotalAmount(invoice.items);

  const patientSubtotal = invoiceItemsTotal.minus(insuranceCoverageTotal);
  const discountTotal = getInvoiceDiscountDiscountAmount(invoice.discount, patientSubtotal);

  // Calculate item adjustments here to be used in the printout
  const itemAdjustmentsTotal = invoice.items.reduce(
    (sum, item) => sum.plus(getItemAdjustmentAmount(item) || 0),
    new Decimal(0),
  );

  const patientTotal = patientSubtotal.minus(discountTotal);

  // Calculate payments as well
  const payments = invoice?.payments || [];
  const patientPaymentsTotal = payments
    .filter(payment => payment?.patientPayment?.id)
    .filter(payment => !payment?.refundPayment?.id) // refund payments are not included in the total
    .filter(payment => !payment?.originalPayment?.id) // refund payments are not included in the total
    .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
    .toNumber();
  const insurerPaymentsTotal = payments
    .filter(payment => payment?.insurerPayment?.id)
    .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
    .toNumber();
  const paymentsTotal = payments
    .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
    .toNumber();

  const patientPaymentRemainingBalance = new Decimal(patientTotal)
    .minus(patientPaymentsTotal)
    .toNumber();
  const insurerPaymentRemainingBalance = new Decimal(insuranceCoverageTotal)
    .minus(insurerPaymentsTotal)
    .toNumber();

  return {
    invoiceItemsTotal: invoiceItemsTotal.toNumber(),
    insuranceCoverageTotal: insuranceCoverageTotal.toNumber(),
    patientTotal: patientTotal.toNumber(),
    discountTotal: discountTotal,
    itemAdjustmentsTotal: itemAdjustmentsTotal.toNumber(),
    patientSubtotal: patientSubtotal.toNumber(),
    patientPaymentsTotal,
    insurerPaymentsTotal,
    paymentsTotal,
    patientPaymentRemainingBalance,
    insurerPaymentRemainingBalance,
  };
};
