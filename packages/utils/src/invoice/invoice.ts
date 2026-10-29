import Decimal from 'decimal.js';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { formatDisplayPrice } from './display';
import {
  calculateInvoiceItem,
  getInsurancePlanItemsForInvoiceItem,
  type InvoiceItemPricing,
} from './invoiceItem';
import { getInvoiceLevelDiscountAmount } from './discount';
import { roundToCents } from './money';
import type { Invoice, InvoiceItem, InvoiceSummary } from './types';

export const isInvoiceEditable = (invoice: Invoice): boolean =>
  invoice.status === INVOICE_STATUSES.IN_PROGRESS;

export interface InvoicePlanCoverage {
  id: string;
  name: string | undefined;
  code: string | undefined;
  totalCoverage: number;
}

export interface InvoicePricing {
  /** One entry per invoice item, in the same order as `invoice.items` */
  items: InvoiceItemPricing[];
  /** One entry per insurance plan attached to the invoice */
  coverageByPlan: InvoicePlanCoverage[];
  summary: InvoiceSummary;
}

const sumOf = (values: Array<number | Decimal>): Decimal =>
  values.reduce<Decimal>((sum, value) => sum.plus(value), new Decimal(0));

/**
 * Calculates the total insurance coverage for a list of invoice items. Each item's coverage is
 * capped at its discounted price.
 */
export const getInsuranceCoverageTotalAmount = (invoiceItems: InvoiceItem[]): Decimal =>
  sumOf(invoiceItems.map(item => calculateInvoiceItem(item).insuranceCoverage));

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
 * The coverage each of the invoice's insurance plans provides, keyed by plan id: the sum of its
 * shares of each line's capped coverage. Only plans attached to the invoice count, so the totals
 * add up to the invoice's insurance total.
 */
const getCoverageTotalsByPlan = (
  invoice: Invoice,
  itemPricings: InvoiceItemPricing[],
): Map<string, Decimal> => {
  const planCoverageTotals = new Map<string, Decimal>(
    (invoice.insurancePlans || []).map(plan => [plan.id, new Decimal(0)]),
  );

  for (const { coverageByPlan } of itemPricings) {
    for (const { insurancePlanId, coverage } of coverageByPlan) {
      const planTotal = planCoverageTotals.get(insurancePlanId);
      if (planTotal) {
        planCoverageTotals.set(insurancePlanId, planTotal.plus(coverage));
      }
    }
  }

  return planCoverageTotals;
};

export const getCoverageAmountPerInsurancePlan = (invoice: Invoice): Map<string, Decimal> =>
  getCoverageTotalsByPlan(invoice, (invoice.items || []).map(calculateInvoiceItem));

const getCoverageByPlan = (
  invoice: Invoice,
  itemPricings: InvoiceItemPricing[],
): InvoicePlanCoverage[] => {
  const planCoverageTotals = getCoverageTotalsByPlan(invoice, itemPricings);

  return (invoice.insurancePlans || []).map(plan => ({
    id: plan.id,
    name: plan.name,
    code: plan.code,
    totalCoverage: (planCoverageTotals.get(plan.id) as Decimal).toNumber(),
  }));
};

/**
 * Every figure derived from an invoice: each line, each insurance plan's share, and the summary.
 *
 * Pure: the input is an invoice hydrated with its items, prices, insurance plans and payments,
 * and the output is numbers. The web app, the printout and the servers all price invoices through
 * this, so they cannot disagree.
 */
export const calculateInvoice = (invoice: Invoice): InvoicePricing => {
  const items = invoice.items || [];
  const itemPricings = items.map(calculateInvoiceItem);

  const invoiceItemsUndiscountedTotal = sumOf(itemPricings.map(({ totalPrice }) => totalPrice));
  const invoiceItemsTotal = sumOf(itemPricings.map(({ discountedPrice }) => discountedPrice));
  const insuranceCoverageTotal = sumOf(
    itemPricings.map(({ insuranceCoverage }) => insuranceCoverage),
  );

  const patientSubtotal = invoiceItemsTotal.minus(insuranceCoverageTotal);
  const discountTotal = roundToCents(
    getInvoiceLevelDiscountAmount(invoice.discount, patientSubtotal.toNumber()),
  ).toNumber();

  // Calculate item adjustments here to be used in the printout
  const itemAdjustmentsTotal = sumOf(itemPricings.map(({ adjustment }) => adjustment));

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

  const summary = {
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

  return {
    items: itemPricings,
    coverageByPlan: getCoverageByPlan(invoice, itemPricings),
    summary,
  };
};

/**
 * Get the summary of an invoice
 */
export const getInvoiceSummary = (invoice: Invoice): InvoiceSummary =>
  calculateInvoice(invoice).summary;

/**
 * Calculate and format the total coverage amount for each insurance plan across all invoice items
 * for display in printout
 */
export const getFormattedCoverageAmountPerInsurancePlanForInvoice = (
  invoice: Invoice,
): Array<{
  id: string;
  name: string | undefined;
  code: string | undefined;
  totalCoverage: string | undefined;
}> =>
  calculateInvoice(invoice).coverageByPlan.map(planCoverage => ({
    ...planCoverage,
    totalCoverage: formatDisplayPrice(new Decimal(planCoverage.totalCoverage).negated().toNumber()),
  }));
