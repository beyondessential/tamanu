import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { INVOICE_ITEMS_CATEGORIES } from '@tamanu/constants';
import { apportionInsuranceCoverage, calculateInvoice, calculateInvoiceItem } from '../src/invoice';
import type { InsurancePlanItem, InvoiceItem } from '../src/invoice/types';

const plan = (id: string, coverageValue: number): InsurancePlanItem => ({
  id,
  name: id,
  code: id,
  coverageValue,
});

const insurableItem = (price: number, plans: InsurancePlanItem[], overrides = {}): InvoiceItem => ({
  id: 'item',
  quantity: 1,
  product: { insurable: true, invoicePriceListItem: { price } },
  insurancePlanItems: plans,
  ...overrides,
});

const sharesOf = (itemPricing: ReturnType<typeof calculateInvoiceItem>) =>
  Object.fromEntries(
    itemPricing.coverageByPlan.map(({ insurancePlanId, coverage }) => [insurancePlanId, coverage]),
  );

describe('calculateInvoiceItem', () => {
  it('caps overlapping plans at the line price and splits the cap pro-rata', () => {
    const pricing = calculateInvoiceItem(
      insurableItem(100, [plan('plan-a', 60), plan('plan-b', 60)]),
    );
    expect(pricing.insuranceCoverage).toBe(100);
    expect(sharesOf(pricing)).toEqual({ 'plan-a': 50, 'plan-b': 50 });
    expect(pricing.netCost).toBe(0);
  });

  it('splits by percentage when plans differ', () => {
    const pricing = calculateInvoiceItem(
      insurableItem(100, [plan('plan-a', 90), plan('plan-b', 30)]),
    );
    expect(sharesOf(pricing)).toEqual({ 'plan-a': 75, 'plan-b': 25 });
  });

  it('gives leftover cents to the plan with the highest percentage', () => {
    const pricing = calculateInvoiceItem(
      insurableItem(100.01, [plan('plan-b', 60), plan('plan-a', 60), plan('plan-c', 80)]),
    );
    // 100.01 split 60:60:80 is 30.003 / 30.003 / 40.004, rounded down to 30 / 30 / 40
    expect(sharesOf(pricing)).toEqual({ 'plan-a': 30, 'plan-b': 30, 'plan-c': 40.01 });
  });

  it('breaks a tie for the leftover cent by plan id', () => {
    const pricing = calculateInvoiceItem(
      insurableItem(100.01, [plan('plan-b', 60), plan('plan-a', 60)]),
    );
    expect(sharesOf(pricing)).toEqual({ 'plan-a': 50.01, 'plan-b': 50 });
  });

  it('leaves each plan its own rounded coverage when the cap does not apply', () => {
    const pricing = calculateInvoiceItem(
      insurableItem(10.01, [plan('plan-a', 33.33), plan('plan-b', 33.33)]),
    );
    expect(pricing.insuranceCoverage).toBe(6.67);
    expect(sharesOf(pricing)).toEqual({ 'plan-a': 3.34, 'plan-b': 3.33 });
  });

  it('prices a fixed-price drug once, whatever the quantity', () => {
    const pricing = calculateInvoiceItem({
      quantity: 14,
      product: {
        category: INVOICE_ITEMS_CATEGORIES.DRUG,
        insurable: true,
        invoicePriceListItem: { price: 25, isFixedPrice: true },
      },
      insurancePlanItems: [plan('plan-a', 60)],
    });
    expect(pricing.totalPrice).toBe(25);
    expect(pricing.insuranceCoverage).toBe(15);
    expect(pricing.netCost).toBe(10);
  });

  it('prices a bed-fee line by the nights recorded as its quantity', () => {
    const pricing = calculateInvoiceItem({
      quantity: 3,
      product: {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        insurable: true,
        invoicePriceListItem: { price: 85.55 },
      },
      insurancePlanItems: [plan('plan-a', 60)],
    });
    expect(pricing.totalPrice).toBe(256.65);
    expect(pricing.insuranceCoverage).toBe(153.99);
    expect(pricing.netCost).toBe(102.66);
  });
});

describe('calculateInvoice', () => {
  it('applies the invoice-level discount to what is left after insurance', () => {
    const { summary } = calculateInvoice({
      discount: { percentage: 0.25 },
      items: [insurableItem(100, [plan('plan-a', 60)]), insurableItem(33.33, [])],
      insurancePlans: [plan('plan-a', 60)],
    });
    expect(summary.insuranceCoverageTotal).toBe(60);
    expect(summary.patientSubtotal).toBe(73.33);
    expect(summary.discountTotal).toBe(18.33);
    expect(summary.patientTotal).toBe(55);
  });

  it('reports per-plan figures that sum to the insurance total when plans overlap', () => {
    const plans = [plan('plan-a', 60), plan('plan-b', 60)];
    const { coverageByPlan, summary } = calculateInvoice({
      items: [insurableItem(100, plans), insurableItem(0.1, plans)],
      insurancePlans: plans,
    });
    expect(coverageByPlan.map(({ totalCoverage }) => totalCoverage)).toEqual([50.05, 50.05]);
    expect(summary.insuranceCoverageTotal).toBe(100.1);
  });
});

describe('apportionInsuranceCoverage', () => {
  it('gives everything to the largest plan when every percentage is zero', () => {
    const shares = apportionInsuranceCoverage(new Decimal(-5), [
      { insurancePlanId: 'plan-a', percentage: 0, coverage: 0 },
      { insurancePlanId: 'plan-b', percentage: 0, coverage: 0 },
    ]);
    expect(shares.map(({ coverage }) => coverage)).toEqual([-5, 0]);
  });
});
