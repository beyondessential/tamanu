import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';

import { INVOICE_STATUSES } from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../../helpers/render';

let access = {};
let availablePlans = [];

vi.mock('../../../app/features/Invoice/useInvoicePatientDetailsAccess', () => ({
  useInvoicePatientDetailsAccess: () => access,
}));

vi.mock('../../../app/api/queries', () => ({
  usePatientAvailableInsurancePlansQuery: () => ({ data: availablePlans, refetch: vi.fn() }),
}));

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability: { can: () => true } }),
}));

vi.mock('../../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: () => undefined }),
}));

vi.mock('../../../app/features/Invoice/PatientPaymentModal', () => ({
  PatientPaymentModal: ({ isOpen }) => (isOpen ? <div data-testid="payment-form" /> : null),
}));

vi.mock('../../../app/features/Invoice/PatientPaymentRefundModal', () => ({
  PatientPaymentRefundModal: () => null,
}));

vi.mock('../../../app/features/Invoice/InsurancePlanFlow', async importActual => {
  const actual = await importActual();
  return {
    ...actual,
    InsurancePlanFlow: ({ step }) => (step ? <div data-testid={`flow-${step}`} /> : null),
  };
});

const { PatientPaymentsTable } = await import('../../../app/features/Invoice/PatientPaymentsTable');

const buildInvoice = ({ insurancePlans = [] } = {}) => ({
  id: 'invoice-1',
  status: INVOICE_STATUSES.FINALISED,
  encounter: { patientId: 'patient-1' },
  insurancePlans,
  payments: [],
  items: [{ id: 'item-1', quantity: 1, priceFinal: 100, productId: 'product-1', product: {} }],
  discount: null,
});

const renderTable = invoice =>
  renderElementWithTranslatedText(<PatientPaymentsTable invoice={invoice} />);

const click = name => fireEvent.click(screen.getByRole('button', { name }));

describe('recording a payment with no insurance plan', () => {
  beforeEach(() => {
    access = { canAddPlanToPatient: true, isInsurancePlanFieldShown: true };
    availablePlans = [];
  });

  it('asks for confirmation before opening the payment form', () => {
    renderTable(buildInvoice());

    click('Record payment');

    expect(screen.getByText('No insurance plan added')).toBeTruthy();
    expect(screen.queryByTestId('payment-form')).toBeNull();
  });

  it('opens the payment form directly when the invoice already has a plan', () => {
    renderTable(buildInvoice({ insurancePlans: [{ id: 'plan-1' }] }));

    click('Record payment');

    expect(screen.getByTestId('payment-form')).toBeTruthy();
    expect(screen.queryByText('No insurance plan added')).toBeNull();
  });

  // A deployment that does not record insurance plans has nothing to be asked about.
  it('opens the payment form directly where the insurance plan field is hidden', () => {
    access = { canAddPlanToPatient: false, isInsurancePlanFieldShown: false };
    renderTable(buildInvoice());

    click('Record payment');

    expect(screen.getByTestId('payment-form')).toBeTruthy();
    expect(screen.queryByText('No insurance plan added')).toBeNull();
  });

  describe('the confirmation', () => {
    beforeEach(() => {
      renderTable(buildInvoice());
      click('Record payment');
    });

    it('goes on to the payment form on Continue without insurance plan', () => {
      click('Continue without insurance plan');

      expect(screen.getByTestId('payment-form')).toBeTruthy();
    });

    it('returns to the invoice on Go back, recording nothing', async () => {
      click('Go back');

      // The dialog lingers through its closing transition, so wait it out rather than read it
      // as still open.
      await waitForElementToBeRemoved(() => screen.queryByText('No insurance plan added'));
      expect(screen.queryByTestId('payment-form')).toBeNull();
    });

    // The patient has no plan this facility can bill, so their details come first.
    it('opens the patient details from Add insurance plan when no plan is available', () => {
      click('Add insurance plan');

      expect(screen.getByTestId('flow-patientDetails')).toBeTruthy();
    });
  });

  it('opens the picker from Add insurance plan when the patient already has a plan', () => {
    availablePlans = [{ id: 'plan-1' }];
    renderTable(buildInvoice());
    click('Record payment');

    click('Add insurance plan');

    expect(screen.getByTestId('flow-picker')).toBeTruthy();
  });

  it('does not offer Add insurance plan where no plan can be added to this invoice', () => {
    access = { canAddPlanToPatient: false, isInsurancePlanFieldShown: true };
    renderTable(buildInvoice());

    click('Record payment');

    expect(screen.getByText('No insurance plan added')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add insurance plan' })).toBeNull();
  });
});
