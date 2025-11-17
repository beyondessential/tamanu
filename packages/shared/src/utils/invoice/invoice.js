import { INVOICE_ITEMS_DISCOUNT_TYPES, INVOICE_STATUSES } from '@tamanu/constants';
import Decimal from 'decimal.js';

/** @typedef {import('@tamanu/database/models').Invoice} Invoice */
/** @typedef {import('@tamanu/database/models').InvoiceDiscount} InvoiceDiscount */
/** @typedef {import('@tamanu/database/models').InvoiceInsurer} InvoiceInsurer */
/** @typedef {import('@tamanu/database/models').InvoiceItem} InvoiceItem */

export const isInvoiceEditable = invoice => invoice.status === INVOICE_STATUSES.IN_PROGRESS;

/**
 * get a price after applying a discount
 * @param {number} price
 * @param {number} discount
 * @returns {number}
 */
const discountedPrice = (price, discount) => {
  return new Decimal(price).minus(discountAmount(price, discount)).toNumber();
};

/**
 * get a discounted price
 * @param {number} price
 * @param {number} discount
 */
const discountAmount = (price, discount) => {
  return new Decimal(price).times(discount).toNumber();
};

/**
 * Get the price of an invoice item
 * @param {InvoiceItem} invoiceItem
 */
export const getInvoiceItemTotalPrice = invoiceItem => {
<<<<<<< Updated upstream
  const rawPriceValue =
    invoiceItem.productPrice ?? invoiceItem?.product?.invoicePriceListItem?.price;
  return new Decimal(rawPriceValue || 0).times(invoiceItem?.quantity || 1).toNumber();
=======
  const price = invoiceItem.productPrice || invoiceItem?.product?.invoicePriceListItem?.price || 0;
  const quantity = invoiceItem.quantity || 1;

  return new Decimal(price).times(quantity).toNumber();
>>>>>>> Stashed changes
};

/**
 * Get the price of an invoice item after applying the discount
 * @param {InvoiceItem} invoiceItem
 */
export const getInvoiceItemTotalDiscountedPrice = invoiceItem => {
  const invoiceItemTotalPrice = getInvoiceItemTotalPrice(invoiceItem);
  if (!invoiceItem.discount) return invoiceItemTotalPrice;
  if (invoiceItem.discount.type === INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE) {
    return discountedPrice(invoiceItemTotalPrice, invoiceItem?.discount?.amount || 0);
  }
  return invoiceItemTotalPrice - (invoiceItem?.discount?.amount || 0);
};

/**
 * Get the discount amount of an invoice insurer
 * @param {InvoiceInsurer} insurer
 * @param {number} total
 */
export const getInvoiceInsurerDiscountAmount = (insurer, total) => {
  return discountAmount(total || 0, insurer?.percentage || 0);
};

/**
 * Get the discount amount of an invoice discount
 * @param {InvoiceDiscount} discount
 * @param {number} total
 */
const getInvoiceDiscountDiscountAmount = (discount, total) => {
  return discountAmount(total || 0, discount?.percentage || 0);
};

/**
 * get invoice summary
 * @param {Invoice} invoice
 * @returns
 */
export const getInvoiceSummary = invoice => {
  invoice = JSON.parse(JSON.stringify(invoice)); // deep clone to convert sequelize entity to plain objects

  const discountableItemsSubtotal = invoice.items
    .filter(item => item?.productDiscountable)
    .reduce((sum, item) => sum.plus(getInvoiceItemTotalDiscountedPrice(item) || 0), new Decimal(0))
    .toNumber();

  const nonDiscountableItemsSubtotal = invoice.items
    .filter(item => !item?.productDiscountable)
    .reduce((sum, item) => sum.plus(getInvoiceItemTotalDiscountedPrice(item) || 0), new Decimal(0))
    .toNumber();

  const itemsSubtotal = new Decimal(discountableItemsSubtotal)
    .add(nonDiscountableItemsSubtotal)
    .toNumber();

  const insurersDiscountPercentage = invoice.insurers
    .reduce((sum, insurer) => sum.plus(insurer?.percentage || 0), new Decimal(0))
    .toNumber();

  const insurerDiscountTotal = new Decimal(itemsSubtotal)
    .times(insurersDiscountPercentage)
    .toNumber();

  const patientSubtotal = new Decimal(itemsSubtotal).minus(insurerDiscountTotal).toNumber();

  const patientDiscountableSubtotal = discountedPrice(
    discountableItemsSubtotal,
    insurersDiscountPercentage,
  );

  const discountTotal = getInvoiceDiscountDiscountAmount(
    invoice.discount,
    patientDiscountableSubtotal,
  );

  const patientTotal = new Decimal(patientSubtotal).minus(discountTotal).toNumber();

  //Calculate payments as well
  const patientPaymentsTotal = invoice.payments
    .filter(payment => payment?.patientPayment?.id)
    .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
    .toNumber();
  const insurerPaymentsTotal = invoice.payments
    .filter(payment => payment?.insurerPayment?.id)
    .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
    .toNumber();
  const paymentsTotal = invoice.payments
    .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
    .toNumber();

  const patientPaymentRemainingBalance = new Decimal(patientTotal)
    .minus(patientPaymentsTotal)
    .toNumber();
  const insurerPaymentRemainingBalance = new Decimal(insurerDiscountTotal)
    .minus(insurerPaymentsTotal)
    .toNumber();

  return {
    discountableItemsSubtotal,
    nonDiscountableItemsSubtotal,
    itemsSubtotal,
    insurerDiscountTotal,
    patientSubtotal,
    patientDiscountableSubtotal,
    discountTotal,
    patientTotal,
    patientPaymentsTotal,
    insurerPaymentsTotal,
    paymentsTotal,
    patientPaymentRemainingBalance,
    insurerPaymentRemainingBalance,
  };
};
