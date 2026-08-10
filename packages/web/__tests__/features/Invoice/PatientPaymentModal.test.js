import { describe, it, expect } from 'vitest';
import { calculateDisplayedBalance } from '../../../app/features/Invoice/PatientPaymentModal';

describe('calculateDisplayedBalance', () => {
  it('shows the pre-edit remaining balance when the amount field is empty', () => {
    expect(
      calculateDisplayedBalance({
        patientPaymentRemainingBalance: 0,
        amount: '',
        paymentRecord: { id: 'payment-1', amount: 10 },
      }),
    ).toBe(0);
  });

  it('recalculates the balance when an existing payment is edited down to a non-zero amount', () => {
    // Invoice fully paid by a $10 payment (remaining balance 0), edited down to $5
    expect(
      calculateDisplayedBalance({
        patientPaymentRemainingBalance: 0,
        amount: 5,
        paymentRecord: { id: 'payment-1', amount: 10 },
      }),
    ).toBe(5);
  });

  it('recalculates the balance when an existing payment is edited down to zero', () => {
    // Invoice fully paid by a $10 payment (remaining balance 0), edited down to $0
    // should restore the full $10 as owing, not stay at $0
    expect(
      calculateDisplayedBalance({
        patientPaymentRemainingBalance: 0,
        amount: 0,
        paymentRecord: { id: 'payment-1', amount: 10 },
      }),
    ).toBe(10);
  });

  it('subtracts the amount from the remaining balance when recording a new payment', () => {
    expect(
      calculateDisplayedBalance({
        patientPaymentRemainingBalance: 10,
        amount: 4,
        paymentRecord: {},
      }),
    ).toBe(6);
  });
});
