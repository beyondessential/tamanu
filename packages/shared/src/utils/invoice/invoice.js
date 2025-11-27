import { INVOICE_ITEMS_DISCOUNT_TYPES, INVOICE_STATUSES } from '@tamanu/constants';
import Decimal from 'decimal.js';
import { keyBy } from 'lodash';

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
 */
export const getInvoiceItemTotalPrice = invoiceItem => {
  const price =
    invoiceItem.priceFinal ??
    invoiceItem.manualEntryPrice ??
    invoiceItem?.product?.invoicePriceListItem?.price ??
    0;
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
 * Calculates the total insurance coverage for a list of invoice items.
 *
 * The function iterates through the provided `invoiceItems`, calculates
 * the discounted price for each item, and determines the total insurance
 * coverage based on each item's associated insurance plans. Each coverage
 * value is capped at the item's discounted price to ensure it does not exceed
 * the discounted amount.
 *
 * @param {Array<Object>} invoiceItems - Array of invoice item objects
 * @returns {Decimal} - The total insurance coverage for all invoice items
 */
export const getInsuranceCoverageTotal = invoiceItems => {
  return invoiceItems.reduce((sum, item) => {
    const discountedPrice = getInvoiceItemTotalDiscountedPrice(item) || 0;

    if (!item.insurancePlanItems) {
      return sum;
    }

    let finalisedInsurancesByPlanId = null;

    if (item.finalisedInsurances) {
      finalisedInsurancesByPlanId = keyBy(item.finalisedInsurances, 'invoiceInsurancePlanId');
    }

    const totalItemInsurance = item.insurancePlanItems.reduce((itemSum, itemPlan) => {
      let displayCoverage = itemPlan.coverageValue;

      if (finalisedInsurancesByPlanId && finalisedInsurancesByPlanId[itemPlan.id]) {
        displayCoverage = finalisedInsurancesByPlanId[itemPlan.id].coverageValueFinal;
      }

      const coverage = new Decimal(discountedPrice).times(displayCoverage / 100).toNumber();
      return itemSum.plus(coverage);
    }, new Decimal(0));

    const cappedItemInsurance =
      totalItemInsurance > discountedPrice ? discountedPrice : totalItemInsurance;
    return sum.plus(cappedItemInsurance);
  }, new Decimal(0));
};

/**
 * get invoice summary
 * @param {Invoice} invoice
 * @returns
 */
export const getInvoiceSummary = invoice => {
  invoice = JSON.parse(JSON.stringify(invoice)); // deep clone to convert sequelize entity to plain objects

  const invoiceItemsTotal = invoice.items.reduce(
    (sum, item) => sum.plus(getInvoiceItemTotalDiscountedPrice(item) || 0),
    new Decimal(0),
  );

  const insuranceCoverageTotal = getInsuranceCoverageTotal(invoice.items);
  const patientTotal = invoiceItemsTotal.minus(insuranceCoverageTotal);

  // Calculate payments as well
  const payments = invoice?.payments || [];
  const patientPaymentsTotal = payments
    .filter(payment => payment?.patientPayment?.id)
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
    patientSubtotal: invoiceItemsTotal.toNumber(),
    insuranceCoverageTotal: insuranceCoverageTotal.toNumber(),
    patientTotal: patientTotal.toNumber(),
    patientPaymentsTotal,
    insurerPaymentsTotal,
    paymentsTotal,
    patientPaymentRemainingBalance,
    insurerPaymentRemainingBalance,
  };
};
