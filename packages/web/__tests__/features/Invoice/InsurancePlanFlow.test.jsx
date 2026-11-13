import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let access = {};
let availablePlans = [];
const refetch = vi.fn();
const notifyError = vi.fn();

vi.mock('../../../app/features/Invoice/useInvoicePatientDetailsAccess', () => ({
  useInvoicePatientDetailsAccess: () => access,
}));

let queryEnabled;
vi.mock('../../../app/api/queries', () => ({
  usePatientAvailableInsurancePlansQuery: ({ enabled }) => {
    queryEnabled = enabled;
    return { data: availablePlans, refetch };
  },
}));

vi.mock('../../../app/utils', () => ({ notifyError }));

vi.mock('../../../app/components/Translation', () => ({
  TranslatedText: ({ fallback }) => <span>{fallback}</span>,
}));

// The two windows the flow moves between, stubbed down to the handlers it wires together.
vi.mock('../../../app/features/Invoice/InvoiceInsuranceModal', () => ({
  InvoiceInsuranceModal: ({ onClose, onSaved, onAddToPatient }) => (
    <div data-testid="picker">
      <button onClick={onClose}>picker close</button>
      <button onClick={() => onSaved(['plan-1'])}>picker save with a plan</button>
      {onAddToPatient && <button onClick={onAddToPatient}>go to patient details</button>}
    </div>
  ),
}));

vi.mock('../../../app/features/Invoice/InvoicePatientDetailsModal', () => ({
  InvoicePatientDetailsModal: ({ onClose, onSaved, editable, focusField }) => (
    <div data-testid="patient-details" data-editable={String(editable)} data-focus={focusField}>
      <button onClick={onClose}>details close</button>
      <button onClick={onSaved}>details save</button>
    </div>
  ),
}));

const { INSURANCE_PLAN_ENTRY, InsurancePlanFlow } = await import(
  '../../../app/features/Invoice/InsurancePlanFlow'
);

const INVOICE = { id: 'invoice-1', encounter: { patientId: 'patient-1' } };

const renderFlow = ({ open = true, entry = INSURANCE_PLAN_ENTRY.PICKER } = {}) => {
  const onClose = vi.fn();
  const onApplied = vi.fn();
  const view = render(
    <InsurancePlanFlow
      invoice={INVOICE}
      open={open}
      entry={entry}
      onClose={onClose}
      onApplied={onApplied}
    />,
  );
  return { onClose, onApplied, view };
};

const click = name => fireEvent.click(screen.getByText(name));

describe('InsurancePlanFlow', () => {
  beforeEach(() => {
    access = { canRecordPlanOnPatient: true, isPatientDetailsEditable: true };
    availablePlans = [];
    queryEnabled = undefined;
    refetch.mockReset().mockResolvedValue({ data: [] });
    notifyError.mockReset();
  });

  describe('while it is closed', () => {
    it('shows nothing', () => {
      renderFlow({ open: false });

      expect(screen.queryByTestId('picker')).toBeNull();
      expect(screen.queryByTestId('patient-details')).toBeNull();
    });

    // Every invoicing pane mounts this flow, so an ungated query would fetch for every invoice
    // whether or not anyone goes near insurance.
    it('does not ask the server for the patient’s plans', () => {
      renderFlow({ open: false });

      expect(queryEnabled).toBe(false);
    });
  });

  describe('opened from the Insurance plan action', () => {
    it('always starts at the picker, whatever plans the patient has', () => {
      renderFlow({ entry: INSURANCE_PLAN_ENTRY.PICKER });

      expect(screen.getByTestId('picker')).toBeTruthy();
    });

    it('offers a route to the patient details when a plan can be recorded on them', () => {
      renderFlow();

      expect(screen.getByText('go to patient details')).toBeTruthy();
    });

    it('offers no such route when the user cannot edit patient records', () => {
      access = { canRecordPlanOnPatient: false, isPatientDetailsEditable: false };
      renderFlow();

      expect(screen.queryByText('go to patient details')).toBeNull();
    });

    it('reports the plans it applied to its caller', () => {
      const { onApplied } = renderFlow();

      click('picker save with a plan');

      expect(onApplied).toHaveBeenCalledWith(['plan-1']);
    });

    it('ends the flow when the picker is closed', () => {
      const { onClose } = renderFlow();

      click('picker close');

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('opened from Add insurance plan', () => {
    it('goes straight to the picker when the patient has a plan at this facility', () => {
      availablePlans = [{ id: 'plan-1' }];
      renderFlow({ entry: INSURANCE_PLAN_ENTRY.AUTO });

      expect(screen.getByTestId('picker')).toBeTruthy();
      expect(screen.queryByTestId('patient-details')).toBeNull();
    });

    it('goes straight to the patient details when they have none', () => {
      renderFlow({ entry: INSURANCE_PLAN_ENTRY.AUTO });

      expect(screen.getByTestId('patient-details').dataset.focus).toBe('invoiceInsurancePlanId');
      expect(screen.queryByTestId('picker')).toBeNull();
    });

    // Nothing can be recorded on the patient, so the picker's empty state is the honest place to
    // land rather than a form they cannot use.
    it('falls back to the picker when a plan cannot be recorded on the patient', () => {
      access = { canRecordPlanOnPatient: false, isPatientDetailsEditable: false };
      renderFlow({ entry: INSURANCE_PLAN_ENTRY.AUTO });

      expect(screen.getByTestId('picker')).toBeTruthy();
    });
  });

  describe('moving between the two windows', () => {
    it('opens the patient details focused on the insurance plan field', () => {
      renderFlow();

      click('go to patient details');

      expect(screen.getByTestId('patient-details').dataset.focus).toBe('invoiceInsurancePlanId');
      expect(screen.queryByTestId('picker')).toBeNull();
    });

    it('passes on whether the details can be edited', () => {
      access = { canRecordPlanOnPatient: true, isPatientDetailsEditable: false };
      renderFlow({ entry: INSURANCE_PLAN_ENTRY.AUTO });

      expect(screen.getByTestId('patient-details').dataset.editable).toBe('false');
    });
  });

  describe('after saving the patient details', () => {
    // The plan now on the patient still has to be chosen for the invoice.
    it('goes on to the picker when a plan is now available at this facility', async () => {
      refetch.mockResolvedValue({ data: [{ id: 'plan-1' }] });
      renderFlow({ entry: INSURANCE_PLAN_ENTRY.AUTO });

      click('details save');

      await waitFor(() => expect(screen.getByTestId('picker')).toBeTruthy());
      expect(screen.queryByTestId('patient-details')).toBeNull();
    });

    // Nothing to pick, so the flow ends rather than showing an empty picker.
    it('ends the flow when no plan is available at this facility', async () => {
      refetch.mockResolvedValue({ data: [] });
      const { onClose } = renderFlow({ entry: INSURANCE_PLAN_ENTRY.AUTO });

      click('details save');

      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    // The save may well have landed, so a failed check must not read as "no plans" and drop the
    // user back on the invoice with nothing explaining why the picker never came.
    it('falls back to the picker and says so when the plans cannot be checked', async () => {
      refetch.mockRejectedValue(new Error('network'));
      const { onClose } = renderFlow({ entry: INSURANCE_PLAN_ENTRY.AUTO });

      click('details save');

      await waitFor(() => expect(screen.getByTestId('picker')).toBeTruthy());
      expect(notifyError).toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('ends the flow when the details are closed without saving', () => {
      const { onClose } = renderFlow({ entry: INSURANCE_PLAN_ENTRY.AUTO });

      click('details close');

      expect(onClose).toHaveBeenCalled();
    });
  });
});
