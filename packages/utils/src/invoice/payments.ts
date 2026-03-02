import Decimal from 'decimal.js';
import { customAlphabet } from 'nanoid';
import {
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
} from '@tamanu/constants';
import { getInvoiceSummary } from './invoice';
import { formatDisplayPrice, round } from './display';
import type { Invoice, Payment } from './types';

const RECEIPT_NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
const RECEIPT_NUMBER_LENGTH = 8;

export const generateReceiptNumber = (): string =>
  customAlphabet(RECEIPT_NUMBER_ALPHABET, RECEIPT_NUMBER_LENGTH)();

export const getInvoicePatientPaymentStatus = (paidAmount: number, owingAmount: number): string => {
  const roundedPaidAmount = round(paidAmount, 2);
  const roundedOwingAmount = round(owingAmount, 2);
  if (roundedPaidAmount < 0) throw new Error('Paid amount cannot be negative');
  if (roundedPaidAmount > roundedOwingAmount)
    throw new Error('Paid amount cannot be greater than owing amount');

  if (roundedPaidAmount === 0) return INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID;
  if (roundedPaidAmount === roundedOwingAmount) return INVOICE_PATIENT_PAYMENT_STATUSES.PAID;
  return INVOICE_PATIENT_PAYMENT_STATUSES.PARTIAL;
};

export const getInvoiceInsurerPaymentStatus = (
  paidAmount: number | null | undefined,
  owingAmount: number,
): string => {
  if (paidAmount == null) return INVOICE_INSURER_PAYMENT_STATUSES.UNPAID;

  const roundedPaidAmount = round(paidAmount, 2);
  const roundedOwingAmount = round(owingAmount, 2);
  if (roundedPaidAmount < 0) throw new Error('Paid amount cannot be negative');
  if (roundedPaidAmount > roundedOwingAmount)
    throw new Error('Paid amount cannot be greater than owing amount');

  if (roundedPaidAmount === 0) return INVOICE_INSURER_PAYMENT_STATUSES.REJECTED;
  if (roundedPaidAmount === roundedOwingAmount) return INVOICE_INSURER_PAYMENT_STATUSES.PAID;
  return INVOICE_INSURER_PAYMENT_STATUSES.PARTIAL;
};

type PaymentWithRemainingBalance = Payment & {
  remainingBalance: number;
};

type PaymentWithDisplayAmounts = Omit<Payment, 'amount'> & {
  amount: string | undefined;
  remainingBalance: string | undefined;
};

const formatPaymentsWithRemainingBalanceDisplay = (
  payments: Array<PaymentWithRemainingBalance>,
): Array<PaymentWithDisplayAmounts> => {
  return payments.map(({ remainingBalance, ...payment }) => ({
    ...payment,
    amount: formatDisplayPrice(payment.amount),
    remainingBalance: formatDisplayPrice(remainingBalance),
  }));
};

export const getPatientPaymentsWithRemainingBalance = (
  invoice: Invoice,
): Array<PaymentWithRemainingBalance> => {
  const payments = invoice.payments || [];
  const patientPayments = payments.filter(payment => payment?.patientPayment?.id);
  let { patientTotal } = getInvoiceSummary(invoice);

  return patientPayments.map(payment => {
    patientTotal = new Decimal(patientTotal).minus(payment.amount).toNumber();
    return {
      ...payment,
      remainingBalance: patientTotal,
    };
  });
};

export const getPatientPaymentsWithRemainingBalanceDisplay = (
  invoice: Invoice,
): Array<PaymentWithDisplayAmounts> => {
  return formatPaymentsWithRemainingBalanceDisplay(getPatientPaymentsWithRemainingBalance(invoice));
};

export const getInsurerPaymentsWithRemainingBalance = (
  invoice: Invoice,
): Array<PaymentWithRemainingBalance> => {
  const payments = invoice.payments || [];
  const insurerPayments = payments.filter(payment => payment?.insurerPayment?.id);
  let { insuranceCoverageTotal } = getInvoiceSummary(invoice);

  return insurerPayments?.map(payment => {
    insuranceCoverageTotal = new Decimal(insuranceCoverageTotal).minus(payment.amount).toNumber();
    return {
      ...payment,
      remainingBalance: insuranceCoverageTotal,
    };
  });
};

export const getInsurerPaymentsWithRemainingBalanceDisplay = (
  invoice: Invoice,
): Array<PaymentWithDisplayAmounts> => {
  return formatPaymentsWithRemainingBalanceDisplay(getInsurerPaymentsWithRemainingBalance(invoice));
};

export const getSpecificInsurerPaymentRemainingBalance = (
  insurers: Array<{ insurerId: string; percentage?: number }>,
  payments: Payment[],
  insurerId: string,
  total: number,
): {
  insurerDiscountTotal: number;
  insurerPaymentsTotal: number;
  insurerPaymentRemainingBalance: number;
} => {
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
