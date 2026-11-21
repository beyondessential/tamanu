import { INVOICE_ITEMS_CATEGORIES, INVOICE_ITEMS_DISCOUNT_TYPES, INVOICE_STATUSES } from '@tamanu/constants';
import type { Invoice, InvoiceItem, InsurancePlanItem } from '../../src/invoice/types';

/**
 * Invoices covering every pricing path, shaped as the facility server hands them to the web and
 * the printout (items carry `insurancePlanItems`). The golden pricing test records what every
 * pricing function produces for each one, so a refactor that moves a figure shows up as a diff.
 */

const planA: InsurancePlanItem = { id: 'plan-a', name: 'Plan A', code: 'PA', coverageValue: 60 };
const planB: InsurancePlanItem = { id: 'plan-b', name: 'Plan B', code: 'PB', coverageValue: 60 };
const planC: InsurancePlanItem = { id: 'plan-c', name: 'Plan C', code: 'PC', coverageValue: 33.33 };

const product = (overrides: Partial<NonNullable<InvoiceItem['product']>> = {}) => ({
  id: 'product',
  name: 'Product',
  insurable: true,
  category: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
  invoicePriceListItem: { price: 100 },
  ...overrides,
});

const item = (id: string, overrides: Partial<InvoiceItem> = {}): InvoiceItem => ({
  id,
  quantity: 1,
  product: product(),
  ...overrides,
});

const patientPayment = (id: string, amount: number) => ({
  id,
  amount,
  patientPayment: { id: `${id}-patient` },
});

const insurancePlanPayment = (id: string, amount: number, invoiceInsurancePlanId: string) => ({
  id,
  amount,
  insurancePlanPayment: { id: `${id}-plan`, invoiceInsurancePlanId },
});

export const invoicePricingFixtures: Record<string, Invoice> = {
  empty: {
    id: 'empty',
    status: INVOICE_STATUSES.IN_PROGRESS,
    items: [],
    payments: [],
    insurancePlans: [],
  },

  noInsurance: {
    id: 'noInsurance',
    status: INVOICE_STATUSES.IN_PROGRESS,
    items: [
      item('quantity-three', { quantity: 3, product: product({ invoicePriceListItem: { price: 12.5 } }) }),
      item('manual-price', { manualEntryPrice: 49.99 }),
      item('no-price', { product: product({ invoicePriceListItem: undefined }) }),
      item('zero-quantity', { quantity: 0 }),
    ],
    payments: [patientPayment('pay-1', 20)],
    insurancePlans: [],
  },

  singlePlan: {
    id: 'singlePlan',
    status: INVOICE_STATUSES.IN_PROGRESS,
    items: [
      item('insured', { insurancePlanItems: [planA] }),
      item('not-insurable', {
        product: product({ insurable: false }),
        insurancePlanItems: [planA],
      }),
      item('no-plan-items', { insurancePlanItems: [] }),
    ],
    payments: [],
    insurancePlans: [planA],
  },

  overlappingPlansOver100: {
    id: 'overlappingPlansOver100',
    status: INVOICE_STATUSES.IN_PROGRESS,
    items: [
      item('overlap', { insurancePlanItems: [planA, planB] }),
      item('overlap-cheap', {
        product: product({ invoicePriceListItem: { price: 0.1 } }),
        insurancePlanItems: [planA, planB],
      }),
      item('one-plan', { insurancePlanItems: [planA, { ...planB, coverageValue: 0 }] }),
    ],
    payments: [],
    insurancePlans: [planA, planB],
  },

  awkwardPercentages: {
    id: 'awkwardPercentages',
    status: INVOICE_STATUSES.IN_PROGRESS,
    items: [
      item('thirds', {
        product: product({ invoicePriceListItem: { price: 10.01 } }),
        insurancePlanItems: [planC, { ...planA, coverageValue: 33.33 }],
      }),
      item('float-sum', {
        quantity: 3,
        product: product({ invoicePriceListItem: { price: 0.1 } }),
        insurancePlanItems: [planC],
      }),
    ],
    payments: [],
    insurancePlans: [planC, planA],
  },

  planNotOnInvoice: {
    id: 'planNotOnInvoice',
    status: INVOICE_STATUSES.IN_PROGRESS,
    items: [item('stray-plan', { insurancePlanItems: [planA, planB] })],
    payments: [],
    insurancePlans: [planA],
  },

  fixedPriceDrug: {
    id: 'fixedPriceDrug',
    status: INVOICE_STATUSES.IN_PROGRESS,
    items: [
      item('fixed-drug', {
        quantity: 14,
        product: product({
          category: INVOICE_ITEMS_CATEGORIES.DRUG,
          invoicePriceListItem: { price: 25, isFixedPrice: true },
        }),
        insurancePlanItems: [planA],
      }),
      item('fixed-not-drug', {
        quantity: 2,
        product: product({ invoicePriceListItem: { price: 25, isFixedPrice: true } }),
      }),
      item('per-unit-drug', {
        quantity: 14,
        product: product({
          category: INVOICE_ITEMS_CATEGORIES.DRUG,
          invoicePriceListItem: { price: 1.15 },
        }),
      }),
    ],
    payments: [],
    insurancePlans: [planA],
  },

  bedFee: {
    id: 'bedFee',
    status: INVOICE_STATUSES.IN_PROGRESS,
    items: [
      item('bed-ward-a', {
        quantity: 3,
        product: product({
          category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
          invoicePriceListItem: { price: 85.5 },
        }),
        insurancePlanItems: [planA],
      }),
      item('bed-ward-b-departed', {
        quantity: 0,
        product: product({
          category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
          invoicePriceListItem: { price: 120 },
        }),
        insurancePlanItems: [planA],
      }),
    ],
    payments: [],
    insurancePlans: [planA],
  },

  itemDiscounts: {
    id: 'itemDiscounts',
    status: INVOICE_STATUSES.IN_PROGRESS,
    items: [
      item('percentage-discount', {
        discount: { type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE, amount: 0.15 },
        insurancePlanItems: [planA],
      }),
      item('amount-discount', {
        discount: { type: INVOICE_ITEMS_DISCOUNT_TYPES.AMOUNT, amount: 0.3 },
        product: product({ invoicePriceListItem: { price: 0.4 } }),
        insurancePlanItems: [planA],
      }),
      item('markup', {
        discount: { type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE, amount: -0.2 },
        insurancePlanItems: [planA],
      }),
      item('discount-past-zero', {
        discount: { type: INVOICE_ITEMS_DISCOUNT_TYPES.AMOUNT, amount: 150 },
        insurancePlanItems: [planA],
      }),
      item('discount-past-zero-no-plans', {
        discount: { type: INVOICE_ITEMS_DISCOUNT_TYPES.AMOUNT, amount: 120 },
        insurancePlanItems: [],
      }),
      item('discount-past-zero-not-insurable', {
        discount: { type: INVOICE_ITEMS_DISCOUNT_TYPES.AMOUNT, amount: 120 },
        product: product({ insurable: false }),
      }),
    ],
    payments: [],
    insurancePlans: [planA],
  },

  invoiceDiscountAfterInsurance: {
    id: 'invoiceDiscountAfterInsurance',
    status: INVOICE_STATUSES.IN_PROGRESS,
    discount: { percentage: 0.25, isManual: true, reason: 'Hardship' },
    items: [
      item('insured', { insurancePlanItems: [planA] }),
      item('uninsured', { product: product({ invoicePriceListItem: { price: 33.33 } }) }),
    ],
    payments: [patientPayment('pay-1', 10)],
    insurancePlans: [planA],
  },

  payments: {
    id: 'payments',
    status: INVOICE_STATUSES.FINALISED,
    items: [item('insured', { priceFinal: 200, insurancePlanItems: [planA, planB] })],
    payments: [
      patientPayment('patient-1', 30),
      patientPayment('patient-2', 15.5),
      {
        id: 'patient-refund',
        amount: -15.5,
        patientPayment: { id: 'patient-refund-patient' },
        originalPayment: { id: 'patient-2' },
      },
      {
        id: 'patient-2-refunded',
        amount: 15.5,
        patientPayment: { id: 'patient-2-refunded-patient' },
        refundPayment: { id: 'patient-refund' },
      },
      insurancePlanPayment('plan-a-1', 100, 'plan-a'),
      insurancePlanPayment('plan-b-1', 20.25, 'plan-b'),
    ],
    insurancePlans: [planA, planB],
  },

  finalised: {
    id: 'finalised',
    status: INVOICE_STATUSES.FINALISED,
    items: [
      item('snapshotted-coverage', {
        priceFinal: 80,
        isFixedPriceFinal: false,
        quantity: 2,
        insurancePlanItems: [planA, planB],
        finalisedInsurances: [
          { invoiceInsurancePlanId: 'plan-a', coverageValueFinal: 50 },
          { invoiceInsurancePlanId: 'plan-b', coverageValueFinal: 70 },
        ],
      }),
      item('snapshot-missing-a-plan', {
        priceFinal: 40,
        insurancePlanItems: [planA, planB],
        finalisedInsurances: [{ invoiceInsurancePlanId: 'plan-a', coverageValueFinal: 10 }],
      }),
      item('fixed-price-final', {
        priceFinal: 25,
        isFixedPriceFinal: true,
        quantity: 14,
        product: product({ category: INVOICE_ITEMS_CATEGORIES.DRUG }),
      }),
    ],
    payments: [patientPayment('pay-1', 5)],
    insurancePlans: [planA, planB],
  },
};
