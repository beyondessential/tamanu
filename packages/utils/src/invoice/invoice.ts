import Decimal from 'decimal.js';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { formatDisplayPrice } from './display';
import { calculateInvoiceItem, capInsuranceCoverage, type InvoiceItemPricing } from './invoiceItem';
import { getInvoiceLevelDiscountAmount } from './discount';
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
 * The insurance coverage a line contributes to the invoice total.
 *
 * This deliberately differs from the line's own `insuranceCoverage` in one edge case: an insurable
 * line with an empty plan list is still capped, so a line discounted below zero contributes its
 * negative discounted price. Kept as-is so consolidating pricing moves no figure.
 */
const getItemCoverageTowardsTotal = (
  item: InvoiceItem,
  itemPricing: InvoiceItemPricing,
): Decimal => {
  if (!item?.product?.insurable || !item.insurancePlanItems) {
    return new Decimal(0);
  }
  return capInsuranceCoverage(itemPricing.coverageByPlan, itemPricing.discountedPrice);
};

/**
 * Calculates the total insurance coverage for a list of invoice items. Each item's coverage is
 * capped at its discounted price.
 */
export const getInsuranceCoverageTotalAmount = (invoiceItems: InvoiceItem[]): Decimal =>
  sumOf(invoiceItems.map(item => getItemCoverageTowardsTotal(item, calculateInvoiceItem(item))));

const getCoverageByPlan = (
  invoice: Invoice,
  itemPricings: InvoiceItemPricing[],
): InvoicePlanCoverage[] => {
  const insurancePlans = invoice.insurancePlans || [];
  const planCoverageTotals = new Map<string, Decimal>(
    insurancePlans.map(plan => [plan.id, new Decimal(0)]),
  );

  for (const itemPricing of itemPricings) {
    for (const planCoverage of itemPricing.coverageByPlan) {
      const planTotal = planCoverageTotals.get(planCoverage.insurancePlanId);
      if (planTotal) {
        planCoverageTotals.set(planCoverage.insurancePlanId, planTotal.plus(planCoverage.coverage));
      }
    }
  }

  return insurancePlans.map(plan => ({
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
    items.map((item, index) => getItemCoverageTowardsTotal(item, itemPricings[index]!)),
  );

  const patientSubtotal = invoiceItemsTotal.minus(insuranceCoverageTotal);
  const discountTotal = getInvoiceLevelDiscountAmount(invoice.discount, patientSubtotal.toNumber());

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
