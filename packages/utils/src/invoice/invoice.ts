import Decimal from 'decimal.js';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { formatDisplayPrice } from './display';
import {
  getInsurancePlanItemsForInvoiceItem,
  getItemSingleInsuranceCoverageAmount,
  getInvoiceItemTotalDiscountedPrice,
  getItemAdjustmentAmount,
  getInvoiceItemTotalPrice,
} from './invoiceItem';
import { getInvoiceLevelDiscountAmount } from './discount';
import type { Invoice, InvoiceItem, InvoiceSummary } from './types';

export const isInvoiceEditable = (invoice: Invoice): boolean =>
  invoice.status === INVOICE_STATUSES.IN_PROGRESS;

/**
 * Calculates the total insurance coverage for a list of invoice items.
 *
 * The function iterates through the provided `invoiceItems`, calculates
 * the discounted price for each item, and determines the total insurance
 * coverage based on each item's associated insurance plans. Each coverage
 * value is capped at the item's discounted price to ensure it does not exceed
 * the discounted amount.
 */
export const getInsuranceCoverageTotalAmount = (invoiceItems: InvoiceItem[]): Decimal => {
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
      totalItemInsurance.toNumber() > discountedPrice
        ? new Decimal(discountedPrice)
        : totalItemInsurance;
    return sum.plus(cappedItemInsurance);
  }, new Decimal(0));
};

/**
 * An invoice whose items carry the plan rows the coverage functions read.
 *
 * Invoice items hold no plan rows of their own, so an invoice loaded straight from the database
 * has to pass through here before any coverage total means anything — skip it and every plan reads
 * as covering nothing, which silently caps payments at zero rather than failing.
 */
export const withInsurancePlanItems = (invoice: Invoice): Invoice => ({
  ...invoice,
  items: (invoice.items || []).map(item => ({
    ...item,
    insurancePlanItems: getInsurancePlanItemsForInvoiceItem(item, invoice.insurancePlans),
  })),
});

/**
 * The coverage each of the invoice's insurance plans provides, keyed by plan id. Totals add up to
 * getInsuranceCoverageTotalAmount: where several plans together cover an item beyond its price,
 * that item's capped coverage is shared between them in proportion to what each would have
 * covered, so no plan is credited with money the invoice never owed.
 */
export const getCoverageAmountPerInsurancePlan = (invoice: Invoice): Map<string, Decimal> => {
  const insurancePlans = invoice.insurancePlans || [];
  const items = invoice.items || [];
  const planCoverageTotals = new Map<string, Decimal>(
    insurancePlans.map(plan => [plan.id, new Decimal(0)]),
  );

  for (const item of items) {
    if (!item?.product?.insurable || !item.insurancePlanItems?.length) {
      continue;
    }

    const discountedPrice = getInvoiceItemTotalDiscountedPrice(item) || 0;
    const itemCoverageByPlan = item.insurancePlanItems
      .filter(planItem => planCoverageTotals.has(planItem.id))
      .map(planItem => ({
        id: planItem.id,
        amount: new Decimal(getItemSingleInsuranceCoverageAmount(discountedPrice, item, planItem)),
      }));

    const itemCoverageTotal = itemCoverageByPlan.reduce(
      (sum, { amount }) => sum.plus(amount),
      new Decimal(0),
    );
    const cappedShare = itemCoverageTotal.greaterThan(discountedPrice)
      ? new Decimal(discountedPrice).dividedBy(itemCoverageTotal)
      : new Decimal(1);

    for (const { id, amount } of itemCoverageByPlan) {
      planCoverageTotals.set(
        id,
        (planCoverageTotals.get(id) as Decimal).plus(amount.times(cappedShare)),
      );
    }
  }

  return planCoverageTotals;
};

/*
 * Calculate and format the total coverage amount for each insurance plan across all invoice items for display in printout
 */
export const getFormattedCoverageAmountPerInsurancePlanForInvoice = (
  invoice: Invoice,
): Array<{
  id: string;
  name: string | undefined;
  code: string | undefined;
  totalCoverage: string | undefined;
}> => {
  const planCoverageTotals = getCoverageAmountPerInsurancePlan(invoice);

  return (invoice.insurancePlans || []).map(plan => ({
    id: plan.id,
    name: plan.name,
    code: plan.code,
    totalCoverage: formatDisplayPrice(
      (planCoverageTotals.get(plan.id) as Decimal).negated().toNumber(),
    ),
  }));
};

/**
 * Get the summary of an invoice
 */
export const getInvoiceSummary = (invoice: Invoice): InvoiceSummary => {
  const items = invoice.items || [];

  const invoiceItemsUndiscountedTotal = items.reduce(
    (sum, item) => sum.plus(getInvoiceItemTotalPrice(item) || 0),
    new Decimal(0),
  );

  const invoiceItemsTotal = items.reduce(
    (sum, item) => sum.plus(getInvoiceItemTotalDiscountedPrice(item) || 0),
    new Decimal(0),
  );

  const insuranceCoverageTotal = getInsuranceCoverageTotalAmount(items);

  const patientSubtotal = invoiceItemsTotal.minus(insuranceCoverageTotal);
  const discountTotal = getInvoiceLevelDiscountAmount(invoice.discount, patientSubtotal.toNumber());

  // Calculate item adjustments here to be used in the printout
  const itemAdjustmentsTotal = items.reduce(
    (sum, item) => sum.plus(getItemAdjustmentAmount(item) || 0),
    new Decimal(0),
  );

  const patientTotal = patientSubtotal.minus(discountTotal);

  // Calculate payments as well
  const payments = invoice?.payments || [];
  const patientPaymentsTotal = payments
    .filter(
      payment =>
        payment?.patientPayment?.id &&
        !payment?.refundPayment?.id && // refund payments are not included in the total
        !payment?.originalPayment?.id, // refund payments are not included in the total
    )
    .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
    .toNumber();
  const insurancePlanPaymentsTotal = payments
    .filter(payment => payment?.insurancePlanPayment?.id)
    .filter(payment => !payment?.refundPayment?.id) // refunded payments are not included in the total
    .filter(payment => !payment?.originalPayment?.id) // refund payments are not included in the total
    .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
    .toNumber();
  const paymentsTotal = payments
    .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
    .toNumber();

  const patientPaymentRemainingBalance = new Decimal(patientTotal)
    .minus(patientPaymentsTotal)
    .toNumber();
  const insurancePlanPaymentRemainingBalance = new Decimal(insuranceCoverageTotal)
    .minus(insurancePlanPaymentsTotal)
    .toNumber();

  return {
    invoiceItemsUndiscountedTotal: invoiceItemsUndiscountedTotal.toNumber(),
    invoiceItemsTotal: invoiceItemsTotal.toNumber(),
    insuranceCoverageTotal: insuranceCoverageTotal.toNumber(),
    patientTotal: patientTotal.toNumber(),
    discountTotal: discountTotal,
    itemAdjustmentsTotal: itemAdjustmentsTotal.toNumber(),
    patientSubtotal: patientSubtotal.toNumber(),
    patientPaymentsTotal,
    insurancePlanPaymentsTotal,
    paymentsTotal,
    patientPaymentRemainingBalance,
    insurancePlanPaymentRemainingBalance,
  };
};
