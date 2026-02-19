import Decimal from 'decimal.js';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { formatDisplayPrice } from './display';
import {
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

/*
 * TODO: this is similar to getInsuranceCoverageTotalAmount and could be combined together
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
  const insurancePlans = invoice.insurancePlans || [];
  const items = invoice.items || [];
  const planCoverageTotals = new Map<string, Decimal>(
    insurancePlans.map(p => [p.id, new Decimal(0)]),
  );

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
          (planCoverageTotals.get(planItem.id) as Decimal).plus(coverageAmount),
        );
      }
    }
  }

  return insurancePlans.map(plan => {
    const totalCoverage = planCoverageTotals.get(plan.id) as Decimal;
    return {
      id: plan.id,
      name: plan.name,
      code: plan.code,
      totalCoverage: formatDisplayPrice(totalCoverage.negated().toNumber()),
    };
  });
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
    invoiceItemsUndiscountedTotal: invoiceItemsUndiscountedTotal.toNumber(),
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
