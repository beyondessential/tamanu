import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let access = {};
let availablePlans = [];
const refetch = vi.fn();

vi.mock('../../../app/features/Invoice/useInvoicePatientDetailsAccess', () => ({
  useInvoicePatientDetailsAccess: () => access,
}));

vi.mock('../../../app/api/queries', () => ({
  usePatientAvailableInsurancePlansQuery: () => ({ data: availablePlans, refetch }),
}));

// The two windows the flow moves between, stubbed down to the handlers it wires together.
vi.mock('../../../app/features/Invoice/InvoiceInsuranceModal', () => ({
  InvoiceInsuranceModal: ({ onClose, onSaved, onAddToPatient }) => (
    <div data-testid="picker">
      <button onClick={onClose}>picker close</button>
      <button onClick={() => onSaved(['plan-1'])}>picker save with a plan</button>
      <button onClick={() => onSaved([])}>picker save with nothing</button>
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

const { INSURANCE_PLAN_STEPS, InsurancePlanFlow } = await import(
  '../../../app/features/Invoice/InsurancePlanFlow'
);

const INVOICE = { id: 'invoice-1', encounter: { patientId: 'patient-1' } };

const Harness = ({ initialStep, onClose, onApplied }) => {
  const [step, setStep] = React.useState(initialStep);
  return (
    <InsurancePlanFlow
      invoice={INVOICE}
      step={step}
      setStep={setStep}
      onClose={() => {
        setStep(null);
        onClose();
      }}
      onApplied={onApplied}
    />
  );
};

const renderFlow = (initialStep = INSURANCE_PLAN_STEPS.PICKER) => {
  const onClose = vi.fn();
  const onApplied = vi.fn();
  render(<Harness initialStep={initialStep} onClose={onClose} onApplied={onApplied} />);
  return { onClose, onApplied };
};

const click = name => fireEvent.click(screen.getByText(name));

describe('InsurancePlanFlow', () => {
  beforeEach(() => {
    access = { canAddPlanToPatient: true, isPatientDetailsEditable: true };
    availablePlans = [];
    refetch.mockReset().mockResolvedValue({ data: [] });
  });

  describe('the picker', () => {
    it('offers a route to the patient details when a plan can still be added', () => {
      renderFlow();

      expect(screen.getByText('go to patient details')).toBeTruthy();
    });

    it('offers no such route when a plan cannot be added to this invoice', () => {
      access = { canAddPlanToPatient: false, isPatientDetailsEditable: false };
      renderFlow();

      expect(screen.queryByText('go to patient details')).toBeNull();
    });

    it('reports the plans it applied to its caller', () => {
      const { onApplied } = renderFlow();

      click('picker save with a plan');

      expect(onApplied).toHaveBeenCalledWith(['plan-1']);
    });

    it('ends the flow when it is closed', () => {
      const { onClose } = renderFlow();

      click('picker close');

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('moving on to the patient details', () => {
    it('opens them focused on the insurance plan field', () => {
      renderFlow();

      click('go to patient details');

      expect(screen.getByTestId('patient-details').dataset.focus).toBe('invoiceInsurancePlanId');
      expect(screen.queryByTestId('picker')).toBeNull();
    });

    it('passes on whether the details can be edited', () => {
      access = { canAddPlanToPatient: true, isPatientDetailsEditable: false };
      renderFlow(INSURANCE_PLAN_STEPS.PATIENT_DETAILS);

      expect(screen.getByTestId('patient-details').dataset.editable).toBe('false');
    });
  });

  describe('after saving the patient details', () => {
    // The plan now on the patient still has to be chosen for the invoice.
    it('goes on to the picker when a plan is now available at this facility', async () => {
      refetch.mockResolvedValue({ data: [{ id: 'plan-1' }] });
      renderFlow(INSURANCE_PLAN_STEPS.PATIENT_DETAILS);

      click('details save');

      await waitFor(() => expect(screen.getByTestId('picker')).toBeTruthy());
      expect(screen.queryByTestId('patient-details')).toBeNull();
    });

    // Nothing to pick, so the flow ends rather than showing an empty picker.
    it('ends the flow when no plan is available at this facility', async () => {
      refetch.mockResolvedValue({ data: [] });
      const { onClose } = renderFlow(INSURANCE_PLAN_STEPS.PATIENT_DETAILS);

      click('details save');

      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('ends the flow when the details are closed without saving', () => {
      const { onClose } = renderFlow(INSURANCE_PLAN_STEPS.PATIENT_DETAILS);

      click('details close');

      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows nothing when the flow has not been started', () => {
    renderFlow(null);

    expect(screen.queryByTestId('picker')).toBeNull();
    expect(screen.queryByTestId('patient-details')).toBeNull();
  });
});
