import Decimal from 'decimal.js';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { formatDisplayPrice } from './display';
import {
  getItemSingleInsuranceCoverageAmount,
  getInvoiceItemTotalDiscountedPrice,
  getItemAdjustmentAmount,
} from './invoiceItem';
import { getInvoiceLevelDiscountAmount } from './discount';

export const isInvoiceEditable = invoice => invoice.status === INVOICE_STATUSES.IN_PROGRESS;

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
  const discountTotal = getInvoiceLevelDiscountAmount(invoice.discount, patientSubtotal);

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
