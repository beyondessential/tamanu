import {
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
} from '@tamanu/constants';
import Decimal from 'decimal.js';
import { formatDisplayPrice, round } from './display';
import { getInvoiceSummary } from './invoice';

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
