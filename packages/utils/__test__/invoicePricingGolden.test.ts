import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateInvoice,
  getFormattedCoverageAmountPerInsurancePlanForInvoice,
  getFormattedInvoiceItemCoverageAmount,
  getFormattedInvoiceItemNetCost,
  getInsurancePlanPaymentsWithRemainingBalance,
  getInsuranceCoverageTotalAmount,
  getInvoiceItemCoveragePercentage,
  getInvoiceItemNetCost,
  getInvoiceItemTotalDiscountedPrice,
  getInvoiceItemTotalPrice,
  getInvoiceSummary,
  getInvoiceSummaryDisplay,
  getItemAdjustmentAmount,
  getItemSingleInsuranceCoverageAmount,
  getItemTotalInsuranceCoverageAmount,
  getPatientPaymentsWithRemainingBalance,
} from '../src/invoice';
import type { Invoice } from '../src/invoice/types';
import { invoicePricingFixtures } from './fixtures/invoicePricingFixtures';

/**
 * Golden record of every figure the pricing utils produce for the fixture invoices. Any change to
 * a figure shows up as a diff in the snapshot file, so a refactor that should not move money can
 * prove it, and a fix that should is reviewed figure by figure.
 */
const describePricing = (invoice: Invoice) => ({
  summary: getInvoiceSummary(invoice),
  summaryDisplay: getInvoiceSummaryDisplay(invoice),
  insuranceCoverageTotal: getInsuranceCoverageTotalAmount(invoice.items ?? []).toString(),
  coverageByPlan: getFormattedCoverageAmountPerInsurancePlanForInvoice(invoice),
  items: (invoice.items ?? []).map(item => {
    const discountedPrice = getInvoiceItemTotalDiscountedPrice(item);
    return {
      id: item.id,
      totalPrice: getInvoiceItemTotalPrice(item),
      discountedPrice,
      adjustment: getItemAdjustmentAmount(item),
      coverage: getItemTotalInsuranceCoverageAmount(item),
      coverageByPlan: (item.insurancePlanItems ?? []).map(planItem => ({
        id: planItem.id,
        percentage: getInvoiceItemCoveragePercentage(item, planItem),
        coverage: getItemSingleInsuranceCoverageAmount(discountedPrice, item, planItem),
      })),
      netCost: getInvoiceItemNetCost(item),
      formattedCoverage: getFormattedInvoiceItemCoverageAmount(item),
      formattedNetCost: getFormattedInvoiceItemNetCost(item),
    };
  }),
  patientPayments: getPatientPaymentsWithRemainingBalance(invoice).map(
    ({ id, remainingBalance }) => ({ id, remainingBalance }),
  ),
  insurancePlanPayments: getInsurancePlanPaymentsWithRemainingBalance(invoice).map(
    ({ id, remainingBalance }) => ({ id, remainingBalance }),
  ),
});

describe('invoice pricing golden record', () => {
  it.each(Object.keys(invoicePricingFixtures))('%s', async fixtureName => {
    const pricing = describePricing(invoicePricingFixtures[fixtureName]!);
    await expect(JSON.stringify(pricing, null, 2)).toMatchFileSnapshot(
      `./__snapshots__/invoicePricingGolden/${fixtureName}.json`,
    );
  });
});

describe('calculateInvoice', () => {
  // Each check derives the expected figure from the per-line helpers, not from calculateInvoice
  it.each(Object.keys(invoicePricingFixtures))('%s: the summary reconciles', fixtureName => {
    const invoice = invoicePricingFixtures[fixtureName]!;
    const items = invoice.items ?? [];
    const { summary, items: itemPricings } = calculateInvoice(invoice);

    const sumOf = (values: number[]) =>
      values.reduce((sum, value) => sum.plus(value), new Decimal(0)).toNumber();

    expect(itemPricings).toHaveLength(items.length);
    expect(summary.invoiceItemsUndiscountedTotal).toEqual(
      sumOf(items.map(item => getInvoiceItemTotalPrice(item))),
    );
    expect(summary.invoiceItemsTotal).toEqual(
      sumOf(items.map(item => getInvoiceItemTotalDiscountedPrice(item))),
    );
    expect(summary.insuranceCoverageTotal).toEqual(
      getInsuranceCoverageTotalAmount(items).toNumber(),
    );
    expect(summary.patientSubtotal).toEqual(
      new Decimal(summary.invoiceItemsTotal).minus(summary.insuranceCoverageTotal).toNumber(),
    );
    expect(summary.patientTotal).toEqual(
      new Decimal(summary.patientSubtotal).minus(summary.discountTotal).toNumber(),
    );
  });
});
