import { round, sumBy, chain } from 'lodash';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { Invoice, InvoiceDiscount, InvoiceInsurer, InvoiceItem } from '../models';

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
  return round(price * (1 - discount), 2);
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
  return round(total * (insurer?.percentage ?? 0), 2);
};

/**
 * Get the discount amount of an invoice discount
 * @param {InvoiceDiscount} discount
 * @param {number} total
 * @returns {number}
 */
const getInvoiceDiscountDiscountAmount = (discount, total) => {
  return round(total * (discount?.percentage ?? 0), 2);
};

/**
 * get invoice summary
 * @param {Invoice} invoice
 * @returns
 */
export const getInvoiceSummary = invoice => {
  const discountableItemsSubtotal = chain(invoice.items)
    .map(item => !item.product.undiscountable)
    .sumBy(item => getInvoiceItemPriceAfterDiscount(item))
    .value();

  const nonDiscountableItemsSubtotal = chain(invoice.items)
    .map(item => item.product.undiscountable)
    .sumBy(item => getInvoiceItemPriceAfterDiscount(item))
    .value();

  const itemsSubtotal = discountableItemsSubtotal + nonDiscountableItemsSubtotal;

  const insurersDiscountPercentage = chain(invoice.insurers)
    .sumBy(insurer => insurer.percentage ?? 0)
    .value();
  const insurerDiscountTotal = round(itemsSubtotal * insurersDiscountPercentage, 2);

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
    .sumBy(payment => payment.amount)
    .value();
  const paymentsTotal = chain(invoice.payments)
    .sumBy(payment => payment.amount)
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
  const summary = getInvoiceSummary(invoice);
  return chain(summary)
    .mapValues(value => formatDisplayValue(value))
    .value();
};

export const getInvoiceItemPriceDisplay = invoiceItem => {
  const result = getInvoiceItemPrice(invoiceItem);
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

export const getInvoiceItemNote = invoiceItem => {
  return invoiceItem?.note;
};
