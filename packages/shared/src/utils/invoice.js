import { round, chain } from 'lodash';
import {
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
  INVOICE_STATUSES,
} from '@tamanu/constants';

/** @typedef {import('../models').Invoice} Invoice */
/** @typedef {import('../models').InvoiceDiscount} InvoiceDiscount */
/** @typedef {import('../models').InvoiceInsurer} InvoiceInsurer */
/** @typedef {import('../models').InvoiceItem} InvoiceItem */

export const isInvoiceEditable = invoice =>
  ![INVOICE_STATUSES.FINALISED, INVOICE_STATUSES.CANCELLED].includes(invoice.status);
/**
 *
 * @param {number} value
 * @returns
 */
const formatDisplayValue = value => (isNaN(value) ? undefined : value.toFixed(2));

/**
 * get a price after applying a discount
 * @param {number} price
 * @param {number} discount
 * @returns {number}
 */
const priceAfterDiscount = (price, discount) => {
  return price * (1 - discount);
};

/**
 * Get the price of an invoice item
 * @param {InvoiceItem} invoiceItem
 * @returns {number}
 */
const getInvoiceItemPrice = invoiceItem => {
  return parseFloat(invoiceItem?.productPrice ?? invoiceItem?.product?.price ?? 0);
};

/**
 * Get the price of an invoice item after applying the discount
 * @param {InvoiceItem} invoiceItem
 * @returns {number}
 */
const getInvoiceItemPriceAfterDiscount = invoiceItem => {
  return priceAfterDiscount(
    getInvoiceItemPrice(invoiceItem),
    invoiceItem?.discount?.percentage ?? 0,
  );
};

/**
 * Get the discount amount of an invoice insurer
 * @param {InvoiceInsurer} insurer
 * @param {number} total
 * @returns {number}
 */
const getInvoiceInsurerDiscountAmount = (insurer, total) => {
  return total * (insurer?.percentage ?? 0);
};

/**
 * Get the discount amount of an invoice discount
 * @param {InvoiceDiscount} discount
 * @param {number} total
 * @returns {number}
 */
const getInvoiceDiscountDiscountAmount = (discount, total) => {
  return total * (discount?.percentage ?? 0);
};

/**
 * get invoice summary
 * @param {Invoice} invoice
 * @returns
 */
export const getInvoiceSummary = invoice => {
  const discountableItemsSubtotal = chain(invoice.items)
    .filter(item => item.product.discountable)
    .sumBy(item => getInvoiceItemPriceAfterDiscount(item) * Number(item.quantity))
    .value();

  const nonDiscountableItemsSubtotal = chain(invoice.items)
    .filter(item => !item.product.discountable)
    .sumBy(item => getInvoiceItemPriceAfterDiscount(item) * Number(item.quantity))
    .value();

  const itemsSubtotal = discountableItemsSubtotal + nonDiscountableItemsSubtotal;

  const insurersDiscountPercentage = chain(invoice.insurers)
    .sumBy(insurer => insurer.percentage ?? 0)
    .value();
  const insurerDiscountTotal = itemsSubtotal * insurersDiscountPercentage;

  const patientDiscountableSubtotal = priceAfterDiscount(
    discountableItemsSubtotal,
    insurersDiscountPercentage,
  );
  const patientNonDiscountableSubtotal = priceAfterDiscount(
    nonDiscountableItemsSubtotal,
    insurersDiscountPercentage,
  );

  const patientSubtotal = patientDiscountableSubtotal + patientNonDiscountableSubtotal;

  const discountTotal = getInvoiceDiscountDiscountAmount(
    invoice.discount,
    patientDiscountableSubtotal,
  );

  const patientTotal = patientSubtotal - discountTotal;

  //Calculate payments as well
  const patientPaymentsTotal = chain(invoice.payments)
    .filter(payment => payment?.patientPayment?.id)
    .sumBy(payment => parseFloat(payment.amount))
    .value();
  const paymentsTotal = chain(invoice.payments)
    .sumBy(payment => parseFloat(payment.amount))
    .value();

  return chain({
    discountableItemsSubtotal,
    nonDiscountableItemsSubtotal,
    itemsSubtotal,
    insurerDiscountTotal,
    patientSubtotal,
    patientDiscountableSubtotal,
    discountTotal,
    patientTotal,
    patientPaymentsTotal,
    paymentsTotal,
  })
    .mapValues(value => round(value, 2))
    .value();
};

/**
 * get invoice summary for display
 * @param {Invoice} invoice
 * @returns
 */
export const getInvoiceSummaryDisplay = invoice => {
  const summary = getInvoiceSummary(invoice);
  return chain(summary)
    .mapValues(value => formatDisplayValue(value))
    .value();
};

export const getInvoiceItemPriceDisplay = invoiceItem => {
  const singleItemPrice = getInvoiceItemPrice(invoiceItem);
  const result = singleItemPrice * invoiceItem?.quantity;
  return formatDisplayValue(result);
};

export const getInvoiceItemDiscountPriceDisplay = invoiceItem => {
  const result = getInvoiceItemPriceAfterDiscount(invoiceItem);
  return formatDisplayValue(result);
};

export const getInsurerPaymentsDisplay = (insurers, total) => {
  return insurers
    .map(insurer => getInvoiceInsurerDiscountAmount(insurer, total))
    .map(payment => formatDisplayValue(payment));
};

export const getInvoiceItemName = invoiceItem => {
  return invoiceItem?.productName;
};

export const getInvoiceItemCode = invoiceItem => {
  return invoiceItem?.productCode ?? invoiceItem?.product?.code;
};

export const getInvoiceItemQuantity = invoiceItem => {
  return invoiceItem?.quantity;
};

export const getInvoiceItemNote = invoiceItem => {
  return invoiceItem?.note;
};

export const getInvoicePatientPaymentStatus = (paidAmount, owingAmount) => {
  if (paidAmount < 0) throw new Error('Paid amount cannot be negative');
  if (paidAmount > owingAmount) throw new Error('Paid amount cannot be greater than owing amount');

  if (paidAmount === 0) return INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID;
  if (paidAmount === owingAmount) return INVOICE_PATIENT_PAYMENT_STATUSES.PAID;
  return INVOICE_PATIENT_PAYMENT_STATUSES.PARTIAL;
};

export const getInvoiceInsurerPaymentStatus = (paidAmount, owingAmount) => {
  if (paidAmount == null) return INVOICE_INSURER_PAYMENT_STATUSES.UNPAID;
  if (paidAmount < 0) throw new Error('Paid amount cannot be negative');
  if (paidAmount > owingAmount) throw new Error('Paid amount cannot be greater than owing amount');

  if (paidAmount === 0) return INVOICE_INSURER_PAYMENT_STATUSES.REJECTED;
  if (paidAmount === owingAmount) return INVOICE_INSURER_PAYMENT_STATUSES.PAID;
  return INVOICE_INSURER_PAYMENT_STATUSES.PARTIAL;
};
