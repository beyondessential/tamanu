import { chain, round, sum } from 'lodash';
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

const getInvoiceItemPrice = invoiceItem => {
  return invoiceItem?.productPrice ?? invoiceItem?.product?.price;
};

/**
 * Get the price of an invoice item
 * @param {InvoiceItem} invoiceItem
 * @returns {number}
 */
const getInvoiceItemFloatPrice = invoiceItem => {
  return parseFloat(getInvoiceItemPrice(invoiceItem) ?? 0);
};

/**
 * get a price after applying a discount
 * @param {number} price
 * @param {number} discount
 * @returns {number}
 */
const priceAfterDiscount = (price, discount) => {
  return round(price * (1 - discount), 2);
};

/**
 * get a discounted price
 * @param {number} price
 * @param {number} discount
 * @returns {number}
 */
const priceDiscounted = (price, discount) => {
  return price - priceAfterDiscount(price, discount);
};

/**
 * Get the price of an invoice item after applying the discount
 * @param {InvoiceItem} invoiceItem
 * @returns {number}
 */
const getInvoiceItemPriceAfterDiscount = invoiceItem => {
  return priceAfterDiscount(
    getInvoiceItemFloatPrice(invoiceItem),
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
  return priceDiscounted(total, insurer?.percentage ?? 0);
};

/**
 * Get the discount amount of an invoice discount
 * @param {InvoiceDiscount} discount
 * @param {number} total
 * @returns {number}
 */
const getInvoiceDiscountDiscountAmount = (discount, total) => {
  return priceDiscounted(total, discount?.percentage ?? 0);
};

const getInsurerPayments = (insurers, total) => {
  return insurers.map(insurer => getInvoiceInsurerDiscountAmount(insurer, total));
};

/**
 * get invoice summary
 * @param {Invoice} invoice
 * @returns
 */
export const getInvoiceSummary = invoice => {
  const discountableItemsSubtotal = chain(invoice.items)
    .filter(item => item?.product?.discountable)
    .sumBy(item => getInvoiceItemPriceAfterDiscount(item) * Number(item.quantity))
    .value();

  const nonDiscountableItemsSubtotal = chain(invoice.items)
    .filter(item => !item?.product?.discountable)
    .sumBy(item => getInvoiceItemPriceAfterDiscount(item) * Number(item.quantity))
    .value();

  const itemsSubtotal = discountableItemsSubtotal + nonDiscountableItemsSubtotal;

  const insurersDiscountPercentage = chain(invoice.insurers)
    .sumBy(insurer => insurer.percentage ?? 0)
    .value();

  const insurerDiscountTotal = sum(getInsurerPayments(invoice.insurers, itemsSubtotal));

  const patientSubtotal = itemsSubtotal - insurerDiscountTotal;

  const patientDiscountableSubtotal = priceAfterDiscount(
    discountableItemsSubtotal,
    insurersDiscountPercentage,
  );

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
    paymentsTotal,
  };
};

/**
 * get invoice summary for display
 * @param {Invoice} invoice
 * @returns
 */
export const getInvoiceSummaryDisplay = invoice => {
  const discountableItems = invoice.items.filter(
    item => item.product?.discountable && !isNaN(getInvoiceItemPrice(item)),
  );
  const nonDiscountableItems = invoice.items.filter(
    item => !item.product?.discountable && !isNaN(getInvoiceItemPrice(item)),
  );
  const summary = getInvoiceSummary(invoice);
  return chain(summary)
    .mapValues((value, key) => {
      if (!discountableItems.length && !nonDiscountableItems.length) return undefined;
      if (!discountableItems.length && key === 'discountableItemsSubtotal') return undefined;
      if (!nonDiscountableItems.length && key === 'nonDiscountableItemsSubtotal') return undefined;
      return formatDisplayValue(value);
    })
    .value();
};

export const getInvoiceItemPriceDisplay = invoiceItem => {
  const singleItemPrice = getInvoiceItemPrice(invoiceItem);
  const result = isNaN(singleItemPrice) ? undefined : singleItemPrice * invoiceItem?.quantity;
  return formatDisplayValue(result);
};

export const getInvoiceItemDiscountPriceDisplay = invoiceItem => {
  const result = isNaN(invoiceItem?.discount?.percentage)
    ? undefined
    : getInvoiceItemPriceAfterDiscount(invoiceItem);
  return formatDisplayValue(result);
};

export const getInsurerPaymentsDisplay = (insurers, total) => {
  return getInsurerPayments(insurers, total).map((payment, index) =>
    formatDisplayValue(isNaN(insurers[index]?.percentage) ? undefined : payment),
  );
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

export const getPatientPaymentRemainingBalance = (payments, invoice) => {
  const totalPatientPayment = payments.reduce((acc, { amount }) => acc + Number(amount), 0);
  const { patientTotal } = getInvoiceSummary(invoice);
  return patientTotal - totalPatientPayment;
};

export const getPatientPaymentsWithRemainingBalance = (patientPayments, invoice) => {
  let { patientTotal } = getInvoiceSummaryDisplay(invoice);
  patientPayments?.data?.forEach(payment => {
    patientTotal -= parseFloat(payment.amount);
    payment.remainingBalance = patientTotal.toFixed(2);
  });
  return patientPayments;
};
