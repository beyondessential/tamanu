import {
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_ITEMS_DISCOUNT_TYPES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
  INVOICE_STATUSES,
} from '@tamanu/constants';
import Decimal from 'decimal.js';
import { mapValues } from 'lodash';

export const round = (value, decimals = 2) => {
  return new Decimal(value).toNearest(new Decimal(10).pow(-decimals)).toNumber();
};

/** @typedef {import('@tamanu/database/models').Invoice} Invoice */
/** @typedef {import('@tamanu/database/models').InvoiceDiscount} InvoiceDiscount */
/** @typedef {import('@tamanu/database/models').InvoiceInsurer} InvoiceInsurer */
/** @typedef {import('@tamanu/database/models').InvoiceItem} InvoiceItem */

export const isInvoiceEditable = invoice => invoice.status === INVOICE_STATUSES.IN_PROGRESS;
/**
 *
 * @param {number} value
 * @returns
 */
export const formatDisplayPrice = value =>
  isNaN(parseFloat(value)) ? undefined : round(value, 2).toFixed(2);

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
const getInvoiceItemTotalPrice = invoiceItem => {
  const rawPriceValue =
    invoiceItem.productPrice ?? invoiceItem?.product?.invoicePriceListItem?.price;
  return new Decimal(rawPriceValue || 0).times(invoiceItem?.quantity || 1).toNumber();
};

/**
 * Get the price of an invoice item after applying the discount
 * @param {InvoiceItem} invoiceItem
 */
const getInvoiceItemTotalDiscountedPrice = invoiceItem => {
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
const getInvoiceInsurerDiscountAmount = (insurer, total) => {
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

/**
 * get invoice summary for display
 * @param {Invoice} invoice
 */
export const getInvoiceSummaryDisplay = invoice => {
  const discountableItems = invoice.items.filter(
    item => item.productDiscountable && !isNaN(parseFloat(item.productPrice)),
  );
  const nonDiscountableItems = invoice.items.filter(
    item => !item.productDiscountable && !isNaN(parseFloat(item.productPrice)),
  );
  const summary = getInvoiceSummary(invoice);
  return mapValues(summary, (value, key) => {
    if (!discountableItems.length && !nonDiscountableItems.length) return undefined;
    if (!discountableItems.length && key === 'discountableItemsSubtotal') return undefined;
    if (!nonDiscountableItems.length && key === 'nonDiscountableItemsSubtotal') return undefined;
    return formatDisplayPrice(value);
  });
};

export const getSpecificInsurerPaymentRemainingBalance = (insurers, payments, insurerId, total) => {
  const insurersDiscountPercentage = insurers
    .filter(insurer => insurer.insurerId === insurerId)
    .reduce((sum, insurer) => sum.plus(insurer?.percentage || 0), new Decimal(0))
    .toNumber();

  const insurerDiscountTotal = new Decimal(total).times(insurersDiscountPercentage).toNumber();

  const insurerPaymentsTotal = payments
    .filter(
      payment => payment?.insurerPayment?.id && payment.insurerPayment.insurerId === insurerId,
    )
    .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
    .toNumber();

  return {
    insurerDiscountTotal,
    insurerPaymentsTotal,
    insurerPaymentRemainingBalance: new Decimal(insurerDiscountTotal)
      .minus(insurerPaymentsTotal)
      .toNumber(),
  };
};

export const getInvoiceItemPriceDisplay = invoiceItem => {
  const rawPriceValue =
    invoiceItem.productPrice ?? invoiceItem?.product?.invoicePriceListItem?.price;

  const unformattedPrice = isNaN(parseFloat(rawPriceValue))
    ? undefined
    : getInvoiceItemTotalPrice(invoiceItem);

  return formatDisplayPrice(unformattedPrice);
};

export const getInvoiceItemDiscountPriceDisplay = invoiceItem => {
  return formatDisplayPrice(
    isNaN(parseFloat(invoiceItem?.discount?.amount))
      ? undefined
      : getInvoiceItemTotalDiscountedPrice(invoiceItem),
  );
};

export const getInsurerDiscountAmountDisplayList = (insurers, total) => {
  return insurers
    .map(insurer => getInvoiceInsurerDiscountAmount(insurer, total || 0))
    .map((value, index) =>
      formatDisplayPrice(isNaN(insurers[index]?.percentage) ? undefined : value),
    );
};

/**
 *
 * @param {number} paidAmount
 * @param {number} owingAmount
 * @returns
 */
export const getInvoicePatientPaymentStatus = (paidAmount, owingAmount) => {
  paidAmount = round(paidAmount, 2);
  owingAmount = round(owingAmount, 2);
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

  paidAmount = round(paidAmount, 2);
  owingAmount = round(owingAmount, 2);
  if (paidAmount < 0) throw new Error('Paid amount cannot be negative');
  if (paidAmount > owingAmount) throw new Error('Paid amount cannot be greater than owing amount');

  if (paidAmount === 0) return INVOICE_INSURER_PAYMENT_STATUSES.REJECTED;
  if (paidAmount === owingAmount) return INVOICE_INSURER_PAYMENT_STATUSES.PAID;
  return INVOICE_INSURER_PAYMENT_STATUSES.PARTIAL;
};

export const getPatientPaymentsWithRemainingBalanceDisplay = invoice => {
  const patientPayments = invoice.payments.filter(payment => payment?.patientPayment?.id);
  let { patientTotal } = getInvoiceSummary(invoice);

  const patientPaymentsWithRemainingBalance = patientPayments?.map(payment => {
    patientTotal = new Decimal(patientTotal).minus(payment.amount).toNumber();
    return {
      ...payment,
      amount: formatDisplayPrice(payment.amount),
      remainingBalance: formatDisplayPrice(patientTotal),
    };
  });
  return patientPaymentsWithRemainingBalance;
};

export const getInsurerPaymentsWithRemainingBalanceDisplay = invoice => {
  const insurerPayments = invoice.payments.filter(payment => payment?.insurerPayment?.id);
  let { insurerDiscountTotal } = getInvoiceSummary(invoice);
  const insurerPaymentsWithRemainingBalance = insurerPayments?.map(payment => {
    insurerDiscountTotal = new Decimal(insurerDiscountTotal).minus(payment.amount).toNumber();
    return {
      ...payment,
      amount: formatDisplayPrice(payment.amount),
      remainingBalance: formatDisplayPrice(insurerDiscountTotal),
    };
  });
  return insurerPaymentsWithRemainingBalance;
};
