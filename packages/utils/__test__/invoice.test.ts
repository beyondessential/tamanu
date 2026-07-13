import { describe, it, expect } from 'vitest';
import { INVOICE_ITEMS_CATEGORIES, INVOICE_ITEMS_DISCOUNT_TYPES } from '@tamanu/constants';
import {
  getInvoiceItemPrice,
  getInvoiceItemTotalPrice,
  getInvoiceItemTotalDiscountedPrice,
  getInvoiceItemCoveragePercentage,
  getInsuranceCoverageTotalAmount,
  getInvoiceSummary,
  getItemTotalInsuranceCoverageAmount,
  getInvoiceItemNetCost,
  isFixedPriceItem,
  getPatientPaymentsWithRemainingBalance,
  getInsurerPaymentsWithRemainingBalance,
} from '../src';

describe('Invoice Utils', () => {
  describe('getInvoiceItemPrice', () => {
    it('should return priceFinal when available', () => {
      const invoiceItem = {
        priceFinal: 150,
        manualEntryPrice: 120,
        product: {
          invoicePriceListItem: {
            price: 100,
          },
        },
      };
      expect(getInvoiceItemPrice(invoiceItem)).toEqual(150);
    });

    it('should return manualEntryPrice when priceFinal is not available', () => {
      const invoiceItem = {
        manualEntryPrice: 120,
        product: {
          invoicePriceListItem: {
            price: 100,
          },
        },
      };
      expect(getInvoiceItemPrice(invoiceItem)).toEqual(120);
    });

    it('should return product.invoicePriceListItem.price when neither priceFinal nor manualEntryPrice are available', () => {
      const invoiceItem = {
        product: {
          invoicePriceListItem: {
            price: 100,
          },
        },
      };
      expect(getInvoiceItemPrice(invoiceItem)).toEqual(100);
    });

    it('should return 0 when no price is available', () => {
      const invoiceItem = {};
      expect(getInvoiceItemPrice(invoiceItem)).toEqual(0);
    });
  });

  describe('getInvoiceItemTotalPrice', () => {
    it('should handle missing price as 0', () => {
      const invoiceItem = {
        quantity: 2,
      };
      expect(getInvoiceItemTotalPrice(invoiceItem)).toEqual(0);
    });

    it('should handle missing quantity as 0', () => {
      const invoiceItem = {
        manualEntryPrice: 100,
      };
      expect(getInvoiceItemTotalPrice(invoiceItem)).toEqual(0);
    });

    it('should handle decimal prices correctly', () => {
      const invoiceItem = {
        manualEntryPrice: 12.99,
        quantity: 3,
      };
      expect(getInvoiceItemTotalPrice(invoiceItem)).toEqual(38.97);
    });

    it('should handle zero quantity', () => {
      const invoiceItem = {
        manualEntryPrice: 100,
        quantity: 0,
      };
      expect(getInvoiceItemTotalPrice(invoiceItem)).toEqual(0);
    });
  });

  describe('getInvoiceItemTotalDiscountedPrice', () => {
    it('should return total price when no discount', () => {
      const invoiceItem = {
        manualEntryPrice: 100,
        quantity: 2,
      };
      expect(getInvoiceItemTotalDiscountedPrice(invoiceItem)).toEqual(200);
    });

    it('should apply percentage discount', () => {
      const invoiceItem = {
        manualEntryPrice: 100,
        quantity: 2,
        discount: {
          type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
          amount: 0.1, // 10%
        },
      };
      expect(getInvoiceItemTotalDiscountedPrice(invoiceItem)).toEqual(180);
    });

    it('should apply flat discount', () => {
      const invoiceItem = {
        manualEntryPrice: 100,
        quantity: 2,
        discount: {
          type: INVOICE_ITEMS_DISCOUNT_TYPES.AMOUNT,
          amount: 20,
        },
      };
      expect(getInvoiceItemTotalDiscountedPrice(invoiceItem)).toEqual(180);
    });

    it('should handle zero discount amount', () => {
      const invoiceItem = {
        manualEntryPrice: 100,
        quantity: 2,
        discount: {
          type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
          amount: 0,
        },
      };
      expect(getInvoiceItemTotalDiscountedPrice(invoiceItem)).toEqual(200);
    });

    it('should handle missing discount amount as 0', () => {
      const invoiceItem = {
        manualEntryPrice: 100,
        quantity: 2,
        discount: {
          type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
        },
      };
      expect(getInvoiceItemTotalDiscountedPrice(invoiceItem)).toEqual(200);
    });

    it('should handle 100% percentage discount', () => {
      const invoiceItem = {
        manualEntryPrice: 100,
        quantity: 2,
        discount: {
          type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
          amount: 1,
        },
      };
      expect(getInvoiceItemTotalDiscountedPrice(invoiceItem)).toEqual(0);
    });

    it('should handle flat discount equal to total price', () => {
      const invoiceItem = {
        manualEntryPrice: 100,
        quantity: 2,
        discount: {
          type: INVOICE_ITEMS_DISCOUNT_TYPES.AMOUNT,
          amount: 200,
        },
      };
      expect(getInvoiceItemTotalDiscountedPrice(invoiceItem)).toEqual(0);
    });
  });

  describe('getInvoiceItemCoveragePercentage', () => {
    it('should return coverageValue when no finalisedInsurances', () => {
      const item = {
        insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
      };
      const insurancePlanItem = { id: 'plan-1', coverageValue: 50 };
      expect(getInvoiceItemCoveragePercentage(item, insurancePlanItem)).toEqual(50);
    });

    it('should return coverageValue when finalisedInsurances is empty', () => {
      const item = {
        finalisedInsurances: [],
        insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
      };
      const insurancePlanItem = { id: 'plan-1', coverageValue: 50 };
      expect(getInvoiceItemCoveragePercentage(item, insurancePlanItem)).toEqual(50);
    });

    it('should return coverageValueFinal when finalisedInsurances exists for the plan', () => {
      const item = {
        finalisedInsurances: [{ invoiceInsurancePlanId: 'plan-1', coverageValueFinal: 60 }],
        insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
      };
      const insurancePlanItem = { id: 'plan-1', coverageValue: 50 };
      expect(getInvoiceItemCoveragePercentage(item, insurancePlanItem)).toEqual(60);
    });

    it('should return original coverageValue when finalisedInsurances does not match plan', () => {
      const item = {
        finalisedInsurances: [{ invoiceInsurancePlanId: 'plan-2', coverageValueFinal: 60 }],
        insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
      };
      const insurancePlanItem = { id: 'plan-1', coverageValue: 50 };
      expect(getInvoiceItemCoveragePercentage(item, insurancePlanItem)).toEqual(50);
    });
  });

  describe('getInsuranceCoverageTotalAmount', () => {
    it('should calculate insurance coverage for single item with one plan', () => {
      const invoiceItems = [
        {
          manualEntryPrice: 100,
          quantity: 1,
          insurancePlanItems: [
            {
              id: 'plan-1',
              coverageValue: 50,
            },
          ],
          product: {
            insurable: true,
          },
        },
      ];
      expect(getInsuranceCoverageTotalAmount(invoiceItems).toNumber()).toEqual(50);
    });

    it('should calculate insurance coverage for multiple plans', () => {
      const invoiceItems = [
        {
          manualEntryPrice: 100,
          quantity: 1,
          insurancePlanItems: [
            { id: 'plan-1', coverageValue: 30 },
            { id: 'plan-2', coverageValue: 20 },
          ],
          product: {
            insurable: true,
          },
        },
      ];
      expect(getInsuranceCoverageTotalAmount(invoiceItems).toNumber()).toEqual(50);
    });

    it('should handle items with no insurance', () => {
      const invoiceItems = [
        {
          manualEntryPrice: 100,
          quantity: 1,
          insurancePlanItems: [],
        },
      ];
      expect(getInsuranceCoverageTotalAmount(invoiceItems).toNumber()).toEqual(0);
    });

    it('should handle items with missing coverageValue', () => {
      const invoiceItems = [
        {
          manualEntryPrice: 100,
          quantity: 1,
          insurancePlanItems: [
            { id: 'plan-1', coverageValue: null },
            { id: 'plan-2', coverageValue: undefined },
          ],
        },
      ];
      expect(getInsuranceCoverageTotalAmount(invoiceItems).toNumber()).toEqual(0);
    });

    it('should calculate insurance coverage on discounted price', () => {
      const invoiceItems = [
        {
          manualEntryPrice: 100,
          quantity: 1,
          discount: {
            type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
            amount: 0.1,
          },
          insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
          product: {
            insurable: true,
          },
        },
      ];
      // Price after discount: 90, insurance: 45
      expect(getInsuranceCoverageTotalAmount(invoiceItems).toNumber()).toEqual(45);
    });

    it('should handle multiple items', () => {
      const invoiceItems = [
        {
          manualEntryPrice: 100,
          quantity: 1,
          insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
          product: {
            insurable: true,
          },
        },
        {
          manualEntryPrice: 200,
          quantity: 1,
          insurancePlanItems: [{ id: 'plan-2', coverageValue: 30 }],
          product: {
            insurable: true,
          },
        },
      ];
      // Item 1: 50, Item 2: 60, Total: 110
      expect(getInsuranceCoverageTotalAmount(invoiceItems).toNumber()).toEqual(110);
    });

    it('should use coverageValueFinal from finalisedInsurances when available', () => {
      const invoiceItems = [
        {
          manualEntryPrice: 100,
          quantity: 1,
          finalisedInsurances: [{ invoiceInsurancePlanId: 'plan-1', coverageValueFinal: 60 }],
          insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
          product: {
            insurable: true,
          },
        },
      ];
      // Should use 60% instead of 50%
      expect(getInsuranceCoverageTotalAmount(invoiceItems).toNumber()).toEqual(60);
    });
  });

  describe('getInvoiceSummary', () => {
    it('should calculate summary for invoice with no items', () => {
      const invoice = {
        items: [],
        payments: [],
      };
      const summary = getInvoiceSummary(invoice);
      expect(summary.invoiceItemsTotal).toEqual(0);
      expect(summary.patientSubtotal).toEqual(0);
      expect(summary.insuranceCoverageTotal).toEqual(0);
      expect(summary.patientTotal).toEqual(0);
      expect(summary.patientPaymentsTotal).toEqual(0);
      expect(summary.insurerPaymentsTotal).toEqual(0);
      expect(summary.paymentsTotal).toEqual(0);
    });

    it('should calculate summary for invoice with items but no insurance', () => {
      const invoice = {
        items: [
          {
            manualEntryPrice: 100,
            quantity: 2,
            insurancePlanItems: [],
          },
          {
            manualEntryPrice: 50,
            quantity: 1,
            insurancePlanItems: [],
          },
        ],
        payments: [],
      };
      const summary = getInvoiceSummary(invoice);
      expect(summary.invoiceItemsTotal).toEqual(250);
      expect(summary.patientSubtotal).toEqual(250);
      expect(summary.insuranceCoverageTotal).toEqual(0);
      expect(summary.patientTotal).toEqual(250);
    });

    it('should calculate summary with insurance coverage', () => {
      const invoice = {
        items: [
          {
            manualEntryPrice: 100,
            quantity: 1,
            insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
            product: {
              insurable: true,
            },
          },
        ],
        payments: [],
      };
      const summary = getInvoiceSummary(invoice);
      expect(summary.invoiceItemsTotal).toEqual(100);
      expect(summary.insuranceCoverageTotal).toEqual(50);
      expect(summary.patientTotal).toEqual(50);
    });

    it('should calculate patient payments total', () => {
      const invoice = {
        items: [
          {
            manualEntryPrice: 100,
            quantity: 1,
            insurancePlanItems: [],
          },
        ],
        payments: [
          {
            amount: 30,
            patientPayment: { id: 'patient-1' },
          },
          {
            amount: 20,
            patientPayment: { id: 'patient-2' },
          },
        ],
      };
      const summary = getInvoiceSummary(invoice);
      expect(summary.patientPaymentsTotal).toEqual(50);
      expect(summary.patientPaymentRemainingBalance).toEqual(50);
    });

    it('should calculate insurer payments total', () => {
      const invoice = {
        items: [
          {
            manualEntryPrice: 100,
            quantity: 1,
            insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
            product: {
              insurable: true,
            },
          },
        ],
        payments: [
          {
            amount: 30,
            insurerPayment: { id: 'insurer-1' },
          },
          {
            amount: 10,
            insurerPayment: { id: 'insurer-2' },
          },
        ],
      };
      const summary = getInvoiceSummary(invoice);
      expect(summary.insurerPaymentsTotal).toEqual(40);
      expect(summary.insurerPaymentRemainingBalance).toEqual(10);
    });

    it('should calculate total payments', () => {
      const invoice = {
        items: [
          {
            manualEntryPrice: 100,
            quantity: 1,
            insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
          },
        ],
        payments: [
          {
            amount: 30,
            patientPayment: { id: 'patient-1' },
          },
          {
            amount: 20,
            insurerPayment: { id: 'insurer-1' },
          },
        ],
      };
      const summary = getInvoiceSummary(invoice);
      expect(summary.paymentsTotal).toEqual(50);
    });

    it('should handle payments without patientPayment or insurerPayment', () => {
      const invoice = {
        items: [
          {
            manualEntryPrice: 100,
            quantity: 1,
            insurancePlanItems: [],
          },
        ],
        payments: [
          {
            amount: 50,
          },
        ],
      };
      const summary = getInvoiceSummary(invoice);
      expect(summary.patientPaymentsTotal).toEqual(0);
      expect(summary.insurerPaymentsTotal).toEqual(0);
      expect(summary.paymentsTotal).toEqual(50);
    });

    it('should calculate remaining balances correctly', () => {
      const invoice = {
        items: [
          {
            manualEntryPrice: 100,
            quantity: 1,
            insurancePlanItems: [{ id: 'plan-1', coverageValue: 60 }],
            product: {
              insurable: true,
            },
          },
        ],
        payments: [
          {
            amount: 20,
            patientPayment: { id: 'patient-1' },
          },
          {
            amount: 30,
            insurerPayment: { id: 'insurer-1' },
          },
        ],
      };
      const summary = getInvoiceSummary(invoice);
      expect(summary.patientTotal).toEqual(40);
      expect(summary.insuranceCoverageTotal).toEqual(60);
      expect(summary.patientPaymentRemainingBalance).toEqual(20);
      expect(summary.insurerPaymentRemainingBalance).toEqual(30);
    });
  });

  describe('fixed-price medications', () => {
    const fixedMedication = (overrides = {}) => ({
      quantity: 30,
      product: {
        category: INVOICE_ITEMS_CATEGORIES.DRUG,
        insurable: true,
        invoicePriceListItem: { price: 2, isFixedPrice: true },
      },
      ...overrides,
    });

    describe('isFixedPriceItem', () => {
      it('is true for a medication flagged fixed on its price-list item', () => {
        expect(isFixedPriceItem(fixedMedication())).toBe(true);
      });

      it('is false for a medication not flagged fixed', () => {
        const item = fixedMedication();
        item.product.invoicePriceListItem.isFixedPrice = false;
        expect(isFixedPriceItem(item)).toBe(false);
      });

      it('ignores the flag for non-medication products', () => {
        const item = fixedMedication();
        item.product.category = INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE;
        expect(isFixedPriceItem(item)).toBe(false);
      });

      it('uses the finalised snapshot once priceFinal is set (fixed)', () => {
        expect(isFixedPriceItem({ priceFinal: 2, isFixedPriceFinal: true, quantity: 30 })).toBe(
          true,
        );
      });

      it('keeps a finalised per-unit line per-unit even if the live price-list flag is now fixed', () => {
        const item = fixedMedication({
          priceFinal: 2,
          isFixedPriceFinal: false,
        });
        // live product is flagged fixed, but the finalised snapshot says per-unit
        expect(isFixedPriceItem(item)).toBe(false);
      });
    });

    describe('getInvoiceItemTotalPrice', () => {
      it('charges the flat fee regardless of quantity', () => {
        expect(getInvoiceItemTotalPrice(fixedMedication({ quantity: 30 }))).toEqual(2);
      });

      it('charges the same flat fee at quantity 1', () => {
        expect(getInvoiceItemTotalPrice(fixedMedication({ quantity: 1 }))).toEqual(2);
      });

      it('still charges price x quantity when not flagged fixed', () => {
        const item = fixedMedication();
        item.product.invoicePriceListItem.isFixedPrice = false;
        expect(getInvoiceItemTotalPrice(item)).toEqual(60);
      });

      it('ignores the flag for non-medication products (price x quantity)', () => {
        const item = fixedMedication();
        item.product.category = INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE;
        expect(getInvoiceItemTotalPrice(item)).toEqual(60);
      });

      it('uses priceFinal x 1 for a finalised fixed line', () => {
        expect(
          getInvoiceItemTotalPrice({ priceFinal: 2, isFixedPriceFinal: true, quantity: 30 }),
        ).toEqual(2);
      });

      it('charges priceFinal x quantity for a finalised per-unit line despite a live fixed flag', () => {
        const item = fixedMedication({ priceFinal: 2, isFixedPriceFinal: false });
        expect(getInvoiceItemTotalPrice(item)).toEqual(60);
      });

      it('treats a manual price override as the new flat fee (override x 1)', () => {
        expect(getInvoiceItemTotalPrice(fixedMedication({ manualEntryPrice: 3.5 }))).toEqual(3.5);
      });
    });

    describe('discounts and insurance apply to the flat fee', () => {
      it('applies a percentage discount to the fee', () => {
        const item = fixedMedication({
          discount: { type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE, amount: 0.1 },
        });
        expect(getInvoiceItemTotalDiscountedPrice(item)).toEqual(1.8);
      });

      it('applies a flat discount to the fee', () => {
        const item = fixedMedication({
          discount: { type: INVOICE_ITEMS_DISCOUNT_TYPES.AMOUNT, amount: 0.5 },
        });
        expect(getInvoiceItemTotalDiscountedPrice(item)).toEqual(1.5);
      });

      it('covers a proportion of the fee (80% of $2 = $1.60)', () => {
        const item = fixedMedication({
          insurancePlanItems: [{ id: 'plan-1', coverageValue: 80 }],
        });
        expect(getItemTotalInsuranceCoverageAmount(item)).toEqual(1.6);
      });

      it('computes coverage off the discounted fee (10% then 80% of $2)', () => {
        const item = fixedMedication({
          discount: { type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE, amount: 0.1 },
          insurancePlanItems: [{ id: 'plan-1', coverageValue: 80 }],
        });
        // discounted fee 1.8, coverage 1.44
        expect(getItemTotalInsuranceCoverageAmount(item)).toEqual(1.44);
        expect(getInvoiceItemNetCost(item)).toEqual(0.36);
      });

      it('caps coverage at the discounted fee', () => {
        const item = fixedMedication({
          insurancePlanItems: [{ id: 'plan-1', coverageValue: 150 }],
        });
        expect(getItemTotalInsuranceCoverageAmount(item)).toEqual(2);
      });
    });

    describe('getInvoiceSummary', () => {
      it('sums the flat fee into the invoice total without quantity leaking in', () => {
        const invoice = {
          items: [
            fixedMedication({ quantity: 30 }),
            { manualEntryPrice: 50, quantity: 2, insurancePlanItems: [] },
          ],
          payments: [],
        };
        const summary = getInvoiceSummary(invoice);
        // fixed line $2 + per-unit line $100
        expect(summary.invoiceItemsTotal).toEqual(102);
      });
    });
  });

  describe('getPatientPaymentsWithRemainingBalance', () => {
    it('nets refunds out of the remaining balance so it agrees with getInvoiceSummary', () => {
      const invoice = {
        items: [
          {
            manualEntryPrice: 100,
            quantity: 1,
            insurancePlanItems: [],
          },
        ],
        payments: [
          {
            id: 'payment-1',
            amount: 100,
            patientPayment: { id: 'patient-1' },
            refundPayment: { id: 'refund-1' },
          },
          {
            id: 'refund-1',
            amount: 100,
            patientPayment: { id: 'patient-2' },
            originalPayment: { id: 'payment-1' },
          },
        ],
      };
      const summary = getInvoiceSummary(invoice);
      const paymentsWithRemainingBalance = getPatientPaymentsWithRemainingBalance(invoice);
      const lastPayment = paymentsWithRemainingBalance[paymentsWithRemainingBalance.length - 1];
      expect(summary.patientPaymentRemainingBalance).toEqual(100);
      expect(lastPayment.remainingBalance).toEqual(summary.patientPaymentRemainingBalance);
    });

    it('still deducts non-refunded payments from the remaining balance', () => {
      const invoice = {
        items: [
          {
            manualEntryPrice: 100,
            quantity: 1,
            insurancePlanItems: [],
          },
        ],
        payments: [
          {
            id: 'payment-1',
            amount: 30,
            patientPayment: { id: 'patient-1' },
          },
          {
            id: 'payment-2',
            amount: 20,
            patientPayment: { id: 'patient-2' },
            refundPayment: { id: 'refund-1' },
          },
          {
            id: 'refund-1',
            amount: 20,
            patientPayment: { id: 'patient-3' },
            originalPayment: { id: 'payment-2' },
          },
        ],
      };
      const summary = getInvoiceSummary(invoice);
      const paymentsWithRemainingBalance = getPatientPaymentsWithRemainingBalance(invoice);
      const lastPayment = paymentsWithRemainingBalance[paymentsWithRemainingBalance.length - 1];
      expect(summary.patientPaymentRemainingBalance).toEqual(70);
      expect(lastPayment.remainingBalance).toEqual(summary.patientPaymentRemainingBalance);
    });
  });

  describe('getInsurerPaymentsWithRemainingBalance', () => {
    it('nets refunds out of the remaining balance', () => {
      const invoice = {
        items: [
          {
            manualEntryPrice: 100,
            quantity: 1,
            insurancePlanItems: [{ id: 'plan-1', coverageValue: 100 }],
            product: {
              insurable: true,
            },
          },
        ],
        payments: [
          {
            id: 'payment-1',
            amount: 40,
            insurerPayment: { id: 'insurer-1', insurerId: 'insurer-a' },
          },
          {
            id: 'payment-2',
            amount: 60,
            insurerPayment: { id: 'insurer-2', insurerId: 'insurer-a' },
            refundPayment: { id: 'refund-1' },
          },
          {
            id: 'refund-1',
            amount: 60,
            insurerPayment: { id: 'insurer-3', insurerId: 'insurer-a' },
            originalPayment: { id: 'payment-2' },
          },
        ],
      };
      const paymentsWithRemainingBalance = getInsurerPaymentsWithRemainingBalance(invoice);
      const lastPayment = paymentsWithRemainingBalance[paymentsWithRemainingBalance.length - 1];
      expect(lastPayment.remainingBalance).toEqual(60);
    });

    it('agrees with getInvoiceSummary when there are no refunds', () => {
      const invoice = {
        items: [
          {
            manualEntryPrice: 100,
            quantity: 1,
            insurancePlanItems: [{ id: 'plan-1', coverageValue: 100 }],
            product: {
              insurable: true,
            },
          },
        ],
        payments: [
          {
            id: 'payment-1',
            amount: 40,
            insurerPayment: { id: 'insurer-1', insurerId: 'insurer-a' },
          },
        ],
      };
      const summary = getInvoiceSummary(invoice);
      const paymentsWithRemainingBalance = getInsurerPaymentsWithRemainingBalance(invoice);
      const lastPayment = paymentsWithRemainingBalance[paymentsWithRemainingBalance.length - 1];
      expect(summary.insurerPaymentRemainingBalance).toEqual(60);
      expect(lastPayment.remainingBalance).toEqual(summary.insurerPaymentRemainingBalance);
    });
  });
});
