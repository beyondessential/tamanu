import Decimal from 'decimal.js';
import { customAlphabet } from 'nanoid';
import {
  INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
} from '@tamanu/constants';
import { getCoverageAmountPerInsurancePlan, getInvoiceSummary } from './invoice';
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

export const getInvoiceInsurancePlanPaymentStatus = (
  paidAmount: number | null | undefined,
  owingAmount: number,
): string => {
  if (paidAmount == null) return INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.UNPAID;

  const roundedPaidAmount = round(paidAmount, 2);
  const roundedOwingAmount = round(owingAmount, 2);
  if (roundedPaidAmount < 0) throw new Error('Paid amount cannot be negative');
  if (roundedPaidAmount > roundedOwingAmount)
    throw new Error('Paid amount cannot be greater than owing amount');

  if (roundedPaidAmount === 0) return INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.REJECTED;
  if (roundedPaidAmount === roundedOwingAmount) return INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PAID;
  return INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PARTIAL;
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
    const isRefundRelated = Boolean(payment?.refundPayment?.id ?? payment?.originalPayment?.id);
    if (!isRefundRelated) {
      patientTotal = new Decimal(patientTotal).minus(payment.amount).toNumber();
    }
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

export const getInsurancePlanPaymentsWithRemainingBalance = (
  invoice: Invoice,
): Array<PaymentWithRemainingBalance> => {
  const payments = invoice.payments || [];
  const insurancePlanPayments = payments.filter(payment => payment?.insurancePlanPayment?.id);
  let { insuranceCoverageTotal } = getInvoiceSummary(invoice);

  return insurancePlanPayments?.map(payment => {
    const isRefundRelated = Boolean(payment?.refundPayment?.id ?? payment?.originalPayment?.id);
    if (!isRefundRelated) {
      insuranceCoverageTotal = new Decimal(insuranceCoverageTotal).minus(payment.amount).toNumber();
    }
    return {
      ...payment,
      remainingBalance: insuranceCoverageTotal,
    };
  });
};

export const getInsurancePlanPaymentsWithRemainingBalanceDisplay = (
  invoice: Invoice,
): Array<PaymentWithDisplayAmounts> => {
  return formatPaymentsWithRemainingBalanceDisplay(getInsurancePlanPaymentsWithRemainingBalance(invoice));
};

/**
 * What one insurance plan still owes on an invoice. Coverage comes from the invoice's items, the
 * same basis the invoice screen and the printout show, so a plan that covers nothing on this
 * invoice owes nothing and can take no payment.
 */
export const getInsurancePlanPaymentBalance = (
  invoice: Invoice,
  invoiceInsurancePlanId: string,
): {
  planCoverageTotal: number;
  planPaymentsTotal: number;
  planPaymentRemainingBalance: number;
} => {
  const planCoverageTotal =
    getCoverageAmountPerInsurancePlan(invoice)
      .get(invoiceInsurancePlanId)
      ?.toNumber() ?? 0;

  const planPaymentsTotal = (invoice.payments || [])
    .filter(
      payment =>
        payment?.insurancePlanPayment?.id &&
        payment.insurancePlanPayment.invoiceInsurancePlanId === invoiceInsurancePlanId,
    )
    .filter(payment => !payment?.refundPayment?.id) // refunded payments are not included in the total
    .filter(payment => !payment?.originalPayment?.id) // refund payments are not included in the total
    .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
    .toNumber();

  return {
    planCoverageTotal,
    planPaymentsTotal,
    planPaymentRemainingBalance: new Decimal(planCoverageTotal).minus(planPaymentsTotal).toNumber(),
  };
};
