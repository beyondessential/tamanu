import { chain, round } from 'lodash';
import {
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
  INVOICE_STATUSES,
} from '@tamanu/constants';

/** @typedef {import('../models').Invoice} Invoice */
/** @typedef {import('../models').InvoiceDiscount} InvoiceDiscount */
/** @typedef {import('../models').InvoiceInsurer} InvoiceInsurer */
/** @typedef {import('../models').InvoiceItem} InvoiceItem */

export const isInvoiceEditable = invoice => invoice.status === INVOICE_STATUSES.IN_PROGRESS;
/**
 *
 * @param {number} value
 * @returns
 */
export const formatDisplayPrice = value =>
  isNaN(parseFloat(value)) ? undefined : round(parseFloat(value), 2).toFixed(2);

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
  return round(price - priceAfterDiscount(price, discount), 2);
};

/**
 * Get the price of an invoice item
 * @param {InvoiceItem} invoiceItem
 * @returns {number}
 */
const getInvoiceItemTotalPrice = invoiceItem => {
  return chain(invoiceItem.productPrice || 0)
    .multiply(Number(invoiceItem?.quantity) || 1)
    .round(2)
    .value();
};

/**
 * Get the price of an invoice item after applying the discount
 * @param {InvoiceItem} invoiceItem
 * @returns {number}
 */
const getInvoiceItemTotalPriceAfterDiscount = invoiceItem => {
  return priceAfterDiscount(
    getInvoiceItemTotalPrice(invoiceItem),
    invoiceItem?.discount?.percentage || 0,
  );
};

/**
 * Get the discount amount of an invoice insurer
 * @param {InvoiceInsurer} insurer
 * @param {number} total
 * @returns {number}
 */
const getInvoiceInsurerDiscountAmount = (insurer, total) => {
  return priceDiscounted(total, insurer?.percentage || 0);
};

/**
 * Get the discount amount of an invoice discount
 * @param {InvoiceDiscount} discount
 * @param {number} total
 * @returns {number}
 */
const getInvoiceDiscountDiscountAmount = (discount, total) => {
  return priceDiscounted(total, discount?.percentage || 0);
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
    .filter(item => item?.productDiscountable)
    .sumBy(item => getInvoiceItemTotalPriceAfterDiscount(item) || 0)
    .round(2)
    .value();

  const nonDiscountableItemsSubtotal = chain(invoice.items)
    .filter(item => !item?.productDiscountable)
    .sumBy(item => getInvoiceItemTotalPriceAfterDiscount(item) || 0)
    .round(2)
    .value();

  const itemsSubtotal = chain(discountableItemsSubtotal + nonDiscountableItemsSubtotal)
    .round(2)
    .value();

  const insurersDiscountPercentage = chain(invoice.insurers)
    .sumBy(insurer => parseFloat(insurer.percentage) || 0)
    .round(2)
    .value();

  const insurerDiscountTotal = chain(getInsurerPayments(invoice.insurers, itemsSubtotal))
    .sum()
    .round(2)
    .value();

  const patientSubtotal = chain(itemsSubtotal)
    .subtract(insurerDiscountTotal)
    .round(2)
    .value();

  const patientDiscountableSubtotal = priceAfterDiscount(
    discountableItemsSubtotal,
    insurersDiscountPercentage,
  );

  const discountTotal = getInvoiceDiscountDiscountAmount(
    invoice.discount,
    patientDiscountableSubtotal,
  );

  const patientTotal = chain(patientSubtotal)
    .subtract(discountTotal)
    .round(2)
    .value();

  //Calculate payments as well
  const patientPaymentsTotal = chain(invoice.payments)
    .filter(payment => payment?.patientPayment?.id)
    .sumBy(payment => parseFloat(payment.amount))
    .round(2)
    .value();
  const insurerPaymentsTotal = chain(invoice.payments)
    .filter(payment => payment?.insurerPayment?.id)
    .sumBy(payment => parseFloat(payment.amount))
    .round(2)
    .value();
  const paymentsTotal = chain(invoice.payments)
    .sumBy(payment => parseFloat(payment.amount))
    .round(2)
    .value();

  const patientPaymentRemainingBalance = chain(patientTotal - patientPaymentsTotal)
    .round(2)
    .value();

  const insurerPaymentRemainingBalance = chain(insurerDiscountTotal - insurerPaymentsTotal)
    .round(2)
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
    insurerPaymentsTotal,
    paymentsTotal,
    patientPaymentRemainingBalance,
    insurerPaymentRemainingBalance,
  };
};

/**
 * get invoice summary for display
 * @param {Invoice} invoice
 * @returns
 */
export const getInvoiceSummaryDisplay = invoice => {
  const discountableItems = invoice.items.filter(
    item => item.productDiscountable && !isNaN(parseFloat(item.productPrice)),
  );
  const nonDiscountableItems = invoice.items.filter(
    item => !item.productDiscountable && !isNaN(parseFloat(item.productPrice)),
  );
  const summary = getInvoiceSummary(invoice);
  return chain(summary)
    .mapValues((value, key) => {
      if (!discountableItems.length && !nonDiscountableItems.length) return undefined;
      if (!discountableItems.length && key === 'discountableItemsSubtotal') return undefined;
      if (!nonDiscountableItems.length && key === 'nonDiscountableItemsSubtotal') return undefined;
      return formatDisplayPrice(value);
    })
    .value();
};

export const getInvoiceItemPriceDisplay = invoiceItem => {
  return formatDisplayPrice(
    isNaN(parseFloat(invoiceItem.productPrice)) ? undefined : getInvoiceItemTotalPrice(invoiceItem),
  );
};

export const getInvoiceItemDiscountPriceDisplay = invoiceItem => {
  return formatDisplayPrice(
    isNaN(parseFloat(invoiceItem?.discount?.percentage))
      ? undefined
      : getInvoiceItemTotalPriceAfterDiscount(invoiceItem),
  );
};

export const getInsurerPaymentsDisplay = (insurers, total) => {
  return getInsurerPayments(insurers, total).map((payment, index) =>
    formatDisplayPrice(isNaN(insurers[index]?.percentage) ? undefined : payment),
  );
};

/**
 *
 * @param {number} paidAmount
 * @param {number} owingAmount
 * @returns
 */
export const getInvoicePatientPaymentStatus = (paidAmount, owingAmount) => {
  if (paidAmount < 0) throw new Error('Paid amount cannot be negative');
  if (paidAmount > owingAmount) throw new Error('Paid amount cannot be greater than owing amount');

  if (paidAmount === 0) return INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID;
  if (paidAmount === owingAmount) return INVOICE_PATIENT_PAYMENT_STATUSES.PAID;
  return INVOICE_PATIENT_PAYMENT_STATUSES.PARTIAL;
};

/**
 *
 * @param {null|number} paidAmount
 * @param {number} owingAmount
 * @returns
 */
export const getInvoiceInsurerPaymentStatus = (paidAmount, owingAmount) => {
  if (paidAmount == null) return INVOICE_INSURER_PAYMENT_STATUSES.UNPAID;
  if (paidAmount < 0) throw new Error('Paid amount cannot be negative');
  if (paidAmount > owingAmount) throw new Error('Paid amount cannot be greater than owing amount');

  if (paidAmount === 0) return INVOICE_INSURER_PAYMENT_STATUSES.REJECTED;
  if (paidAmount === owingAmount) return INVOICE_INSURER_PAYMENT_STATUSES.PAID;
  return INVOICE_INSURER_PAYMENT_STATUSES.PARTIAL;
};

export const getPatientPaymentsWithRemainingBalance = invoice => {
  const patientPayments = invoice.payments.filter(payment => payment?.patientPayment?.id);
  let { patientTotal } = getInvoiceSummaryDisplay(invoice);
  const patientPaymentsWithRemainingBalance = patientPayments?.map(payment => {
    patientTotal = round(patientTotal - parseFloat(payment.amount), 2);
    return {
      ...payment,
      remainingBalance: patientTotal.toFixed(2),
    };
  });
  return patientPaymentsWithRemainingBalance;
};

export const getInsurerPaymentsWithRemainingBalance = invoice => {
  const insurerPayments = invoice.payments.filter(payment => payment?.insurerPayment?.id);
  let { insurerDiscountTotal } = getInvoiceSummaryDisplay(invoice);
  const insurerPaymentsWithRemainingBalance = insurerPayments?.map(payment => {
    insurerDiscountTotal = round(insurerDiscountTotal - parseFloat(payment.amount), 2);
    return {
      ...payment,
      remainingBalance: insurerDiscountTotal.toFixed(2),
    };
  });
  return insurerPaymentsWithRemainingBalance;
};
