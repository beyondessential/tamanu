import { INVOICE_ITEMS_DISCOUNT_TYPES } from '@tamanu/constants';
import {
  getInvoiceItemPrice,
  getInvoiceItemTotalPrice,
  getInvoiceItemTotalDiscountedPrice,
  getInvoiceItemCoverageValue,
  getInsuranceCoverageTotal,
  getInvoiceSummary,
} from '../../src/utils';

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
          type: INVOICE_ITEMS_DISCOUNT_TYPES.FLAT,
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
          type: INVOICE_ITEMS_DISCOUNT_TYPES.FLAT,
          amount: 200,
        },
      };
      expect(getInvoiceItemTotalDiscountedPrice(invoiceItem)).toEqual(0);
    });
  });

  describe('getInvoiceItemCoverageValue', () => {
    it('should return coverageValue when no finalisedInsurances', () => {
      const item = {
        insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
      };
      const insurancePlanItem = { id: 'plan-1', coverageValue: 50 };
      expect(getInvoiceItemCoverageValue(item, insurancePlanItem)).toEqual(50);
    });

    it('should return coverageValue when finalisedInsurances is empty', () => {
      const item = {
        finalisedInsurances: [],
        insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
      };
      const insurancePlanItem = { id: 'plan-1', coverageValue: 50 };
      expect(getInvoiceItemCoverageValue(item, insurancePlanItem)).toEqual(50);
    });

    it('should return coverageValueFinal when finalisedInsurances exists for the plan', () => {
      const item = {
        finalisedInsurances: [{ invoiceInsurancePlanId: 'plan-1', coverageValueFinal: 60 }],
        insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
      };
      const insurancePlanItem = { id: 'plan-1', coverageValue: 50 };
      expect(getInvoiceItemCoverageValue(item, insurancePlanItem)).toEqual(60);
    });

    it('should return original coverageValue when finalisedInsurances does not match plan', () => {
      const item = {
        finalisedInsurances: [{ invoiceInsurancePlanId: 'plan-2', coverageValueFinal: 60 }],
        insurancePlanItems: [{ id: 'plan-1', coverageValue: 50 }],
      };
      const insurancePlanItem = { id: 'plan-1', coverageValue: 50 };
      expect(getInvoiceItemCoverageValue(item, insurancePlanItem)).toEqual(50);
    });
  });

  describe('getInsuranceCoverageTotal', () => {
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
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(50);
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
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(50);
    });

    it('should handle items with no insurance', () => {
      const invoiceItems = [
        {
          manualEntryPrice: 100,
          quantity: 1,
          insurancePlanItems: [],
        },
      ];
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(0);
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
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(0);
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
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(45);
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
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(110);
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
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(60);
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
});
