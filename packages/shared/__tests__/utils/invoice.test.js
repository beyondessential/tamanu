import { INVOICE_ITEMS_DISCOUNT_TYPES } from '@tamanu/constants';
import {
  getInvoiceItemTotalPrice,
  getInvoiceItemTotalDiscountedPrice,
  getInsuranceCoverageTotal,
  getInvoiceSummary,
} from '../../src/utils';

describe('Invoice Utils', () => {
  describe('getInvoiceItemTotalPrice', () => {
    it('should calculate price from productPrice', () => {
      const invoiceItem = {
        productPrice: 100,
        quantity: 2,
      };
      expect(getInvoiceItemTotalPrice(invoiceItem)).toEqual(200);
    });

    it('should calculate price from product.invoicePriceListItem.price', () => {
      const invoiceItem = {
        product: {
          invoicePriceListItem: {
            price: 50,
          },
        },
        quantity: 3,
      };
      expect(getInvoiceItemTotalPrice(invoiceItem)).toEqual(150);
    });

    it('should prioritize productPrice over product.invoicePriceListItem.price', () => {
      const invoiceItem = {
        productPrice: 100,
        product: {
          invoicePriceListItem: {
            price: 50,
          },
        },
        quantity: 2,
      };
      expect(getInvoiceItemTotalPrice(invoiceItem)).toEqual(200);
    });

    it('should handle missing price as 0', () => {
      const invoiceItem = {
        quantity: 2,
      };
      expect(getInvoiceItemTotalPrice(invoiceItem)).toEqual(0);
    });

    it('should handle missing quantity as 1', () => {
      const invoiceItem = {
        productPrice: 100,
      };
      expect(getInvoiceItemTotalPrice(invoiceItem)).toEqual(100);
    });

    it('should handle decimal prices correctly', () => {
      const invoiceItem = {
        productPrice: 12.99,
        quantity: 3,
      };
      expect(getInvoiceItemTotalPrice(invoiceItem)).toEqual(38.97);
    });

    it('should handle zero quantity', () => {
      const invoiceItem = {
        productPrice: 100,
        quantity: 0,
      };
      expect(getInvoiceItemTotalPrice(invoiceItem)).toEqual(0);
    });
  });

  describe('getInvoiceItemTotalDiscountedPrice', () => {
    it('should return total price when no discount', () => {
      const invoiceItem = {
        productPrice: 100,
        quantity: 2,
      };
      expect(getInvoiceItemTotalDiscountedPrice(invoiceItem)).toEqual(200);
    });

    it('should apply percentage discount', () => {
      const invoiceItem = {
        productPrice: 100,
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
        productPrice: 100,
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
        productPrice: 100,
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
        productPrice: 100,
        quantity: 2,
        discount: {
          type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
        },
      };
      expect(getInvoiceItemTotalDiscountedPrice(invoiceItem)).toEqual(200);
    });

    it('should handle 100% percentage discount', () => {
      const invoiceItem = {
        productPrice: 100,
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
        productPrice: 100,
        quantity: 2,
        discount: {
          type: INVOICE_ITEMS_DISCOUNT_TYPES.FLAT,
          amount: 200,
        },
      };
      expect(getInvoiceItemTotalDiscountedPrice(invoiceItem)).toEqual(0);
    });
  });

  describe('getInsuranceCoverageTotal', () => {
    it('should calculate insurance coverage for single item with one plan', () => {
      const invoiceItems = [
        {
          productPrice: 100,
          quantity: 1,
          insurancePlanItems: [
            {
              coverageValue: 50, // 50%
            },
          ],
        },
      ];
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(50);
    });

    it('should calculate insurance coverage for multiple plans', () => {
      const invoiceItems = [
        {
          productPrice: 100,
          quantity: 1,
          insurancePlanItems: [
            { coverageValue: 30 }, // 30%
            { coverageValue: 20 }, // 20%
          ],
        },
      ];
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(50);
    });

    it('should handle items with no insurance', () => {
      const invoiceItems = [
        {
          productPrice: 100,
          quantity: 1,
          insurancePlanItems: [],
        },
      ];
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(0);
    });

    it('should handle items with missing coverageValue', () => {
      const invoiceItems = [
        {
          productPrice: 100,
          quantity: 1,
          insurancePlanItems: [{ coverageValue: null }, { coverageValue: undefined }],
        },
      ];
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(0);
    });

    it('should calculate insurance coverage on discounted price', () => {
      const invoiceItems = [
        {
          productPrice: 100,
          quantity: 1,
          discount: {
            type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
            amount: 0.1, // 10% discount
          },
          insurancePlanItems: [
            { coverageValue: 50 }, // 50% coverage
          ],
        },
      ];
      // Price after discount: 90, insurance: 45
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(45);
    });

    it('should handle multiple items', () => {
      const invoiceItems = [
        {
          productPrice: 100,
          quantity: 1,
          insurancePlanItems: [{ coverageValue: 50 }],
        },
        {
          productPrice: 200,
          quantity: 1,
          insurancePlanItems: [{ coverageValue: 30 }],
        },
      ];
      // Item 1: 50, Item 2: 60, Total: 110
      expect(getInsuranceCoverageTotal(invoiceItems).toNumber()).toEqual(110);
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
            productPrice: 100,
            quantity: 2,
            insurancePlanItems: [],
          },
          {
            productPrice: 50,
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
            productPrice: 100,
            quantity: 1,
            insurancePlanItems: [{ coverageValue: 50 }],
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
            productPrice: 100,
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
            productPrice: 100,
            quantity: 1,
            insurancePlanItems: [{ coverageValue: 50 }],
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
            productPrice: 100,
            quantity: 1,
            insurancePlanItems: [{ coverageValue: 50 }],
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
            productPrice: 100,
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
            productPrice: 100,
            quantity: 1,
            insurancePlanItems: [{ coverageValue: 60 }],
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
