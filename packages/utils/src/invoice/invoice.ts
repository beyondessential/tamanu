import Decimal from 'decimal.js';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { formatDisplayPrice } from './display';
import {
  calculateInvoiceItem,
  capInsuranceCoverage,
  getInsurancePlanItemsForInvoiceItem,
  type InvoiceItemPlanCoverage,
  type InvoiceItemPricing,
} from './invoiceItem';
import { getInvoiceLevelDiscountAmount } from './discount';
import type { InsurancePlan, Invoice, InvoiceItem, InvoiceSummary } from './types';

export const isInvoiceEditable = (invoice: Invoice): boolean =>
  invoice.status === INVOICE_STATUSES.IN_PROGRESS;

export interface InvoicePlanCoverage {
  id: string;
  name: string | undefined;
  code: string | undefined;
  /** The section this coverage applies to, or null where the plan covers the whole invoice */
  invoiceSectionId: string | null;
  totalCoverage: number;
}

export interface InvoicePricing {
  /** One entry per invoice item, in the same order as `invoice.items` */
  items: InvoiceItemPricing[];
  /** One entry per attachment of an insurance plan to the invoice, section by section */
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

// Sequelize nests the attachment row under the through model's name
const ATTACHMENT_KEY = 'InvoicesInvoiceInsurancePlan';

const asAttachment = (
  attachment: Record<string, any>,
  plan: Record<string, any>,
): InsurancePlan => ({
  ...plan,
  attachmentId: attachment.id,
  invoiceSectionId: attachment.invoiceSectionId ?? null,
});

/**
 * The invoice's plans as attachments: one entry per attachment, each carrying the section it
 * covers. A plan attached to two sections is two entries, which is the grain coverage is keyed at.
 *
 * An invoice loaded for pricing carries the attachment rows themselves, since loading through the
 * plans keys them by the plan and drops one of the two sections. The nested form is still read for
 * an invoice loaded that way; a section left nested reads as covering the whole invoice, which
 * overstates what every sectioned plan owes.
 */
export const withInsuranceAttachments = (invoice: Invoice): Invoice => {
  const attachments = (invoice as Record<string, any>).insurancePlanAttachments;
  if (attachments) {
    return {
      ...invoice,
      insurancePlans: attachments.map((attachment: Record<string, any>) =>
        asAttachment(attachment, attachment.invoiceInsurancePlan ?? {}),
      ),
    };
  }

  return {
    ...invoice,
    insurancePlans: (invoice.insurancePlans || []).map(plan => {
      const attachment = (plan as Record<string, any>)[ATTACHMENT_KEY];
      return attachment ? asAttachment(attachment, plan) : plan;
    }),
  };
};

/**
 * The plans covering an invoice, one entry each. The invoice carries an entry per attachment, so
 * a plan covering two sections appears twice; anything naming the payers rather than pricing them
 * wants this instead.
 */
export const getDistinctInsurancePlans = (invoice: Invoice): InsurancePlan[] => {
  const seen = new Set<string>();
  return (invoice.insurancePlans || []).filter(plan => {
    if (seen.has(plan.id)) return false;
    seen.add(plan.id);
    return true;
  });
};

/**
 * An invoice whose items carry the plan rows the coverage functions read.
 *
 * Invoice items hold no plan rows of their own, so an invoice loaded straight from the database
 * has to pass through here before any coverage total means anything — skip it and every plan reads
 * as covering nothing, which silently caps payments at zero rather than failing.
 */
export const withInsurancePlanItems = (invoice: Invoice): Invoice => {
  const withAttachments = withInsuranceAttachments(invoice);
  return {
    ...withAttachments,
    items: (withAttachments.items || []).map(item => ({
      ...item,
      insurancePlanItems: getInsurancePlanItemsForInvoiceItem(item, withAttachments.insurancePlans),
    })),
  };
};

/**
 * What identifies one lot of coverage. The same plan attached to two sections is two lots, so the
 * attachment is the key where the invoice carries its plan rows; an invoice built without them
 * still keys by the plan itself, and keeps the whole-invoice behaviour it had.
 */
const coverageKeyOf = (plan: InsurancePlan): string => plan.attachmentId ?? plan.id;

/**
 * The coverage each attachment of an insurance plan provides, keyed as above. Totals add up to
 * the invoice's insurance total: where several plans together cover a line beyond its price, the
 * line's capped coverage is shared between them in proportion to what each would have covered, so
 * no plan is credited with money the invoice never owed. Only plans attached to the invoice count.
 */
const getCoverageTotalsByPlan = (
  invoice: Invoice,
  itemPricings: InvoiceItemPricing[],
): Map<string, Decimal> => {
  const planCoverageTotals = new Map<string, Decimal>(
    (invoice.insurancePlans || []).map(plan => [coverageKeyOf(plan), new Decimal(0)]),
  );

  const keyOfCoverage = (planCoverage: InvoiceItemPlanCoverage) =>
    planCoverage.attachmentId ?? planCoverage.insurancePlanId;

  for (const { coverageByPlan, discountedPrice } of itemPricings) {
    const attachedPlanCoverages = coverageByPlan.filter(planCoverage =>
      planCoverageTotals.has(keyOfCoverage(planCoverage)),
    );
    const itemCoverageTotal = sumOf(attachedPlanCoverages.map(({ coverage }) => coverage));
    const cappedShare = itemCoverageTotal.greaterThan(discountedPrice)
      ? new Decimal(discountedPrice).dividedBy(itemCoverageTotal)
      : new Decimal(1);

    for (const planCoverage of attachedPlanCoverages) {
      const key = keyOfCoverage(planCoverage);
      planCoverageTotals.set(
        key,
        (planCoverageTotals.get(key) as Decimal).plus(
          new Decimal(planCoverage.coverage).times(cappedShare),
        ),
      );
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
    invoiceSectionId: plan.invoiceSectionId ?? null,
    totalCoverage: (planCoverageTotals.get(coverageKeyOf(plan)) as Decimal).toNumber(),
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
