import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import { route } from '@tamanu/api-client';

import { renderElementWithTranslatedText } from '../../helpers/render';

const put = vi.fn();
let formIsDirty = false;

vi.mock('../../../app/api', () => ({
  useApi: () => ({ get: vi.fn().mockResolvedValue([]), put }),
}));

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ facilityId: 'facility-1' }),
}));

let isLoadingPatient = false;
vi.mock('../../../app/api/queries', () => ({
  usePatientDataQuery: () => ({ data: { id: 'patient-1' }, isLoading: isLoadingPatient }),
  usePatientAdditionalDataQuery: () => ({ data: {}, isLoading: false }),
  usePatientBirthDataQuery: () => ({ data: {}, isLoading: false }),
  usePatientInsurancePlansQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../../app/utils', () => ({
  invalidatePatientDataQueries: vi.fn().mockResolvedValue(undefined),
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

// Stands in for the real patient details form: reports the dirty state the test is exercising and
// hands back a submit handler, which is the whole of the contract the modal depends on.
vi.mock('../../../app/forms/PatientDetailsForm/PatientDetailsForm', () => ({
  PatientDetailsForm: ({ onSubmit, renderExtraContent }) => (
    <div>
      <span data-testid="form-body">patient details form</span>
      {renderExtraContent({ submitForm: () => onSubmit({ firstName: 'Ada' }) })}
    </div>
  ),
}));

vi.mock('../../../app/forms/PatientDetailsForm/ConfiguredMandatoryPatientFields', () => ({
  getPatientFieldTestId: name => `localisedfield-0jtf-${name}`,
}));

const resetForm = vi.fn();
vi.mock('formik', async importActual => ({
  ...(await importActual()),
  useFormikContext: () => ({ dirty: formIsDirty, isSubmitting: false, resetForm, values: {} }),
}));

const { InvoicePatientDetailsModal } = await import(
  '../../../app/features/Invoice/InvoicePatientDetailsModal'
);

const renderModal = ({ editable = true, onClose = vi.fn(), onSaved = vi.fn() } = {}) => {
  renderElementWithTranslatedText(
    <InvoicePatientDetailsModal
      open
      patientId="patient-1"
      editable={editable}
      onClose={onClose}
      onSaved={onSaved}
    />,
  );
  return { onClose, onSaved };
};

// The modal's corner dismiss button is also labelled Close, so the bottom row is read by test id.
const action = name => screen.getByTestId(`patient-details-${name}`);
const button = name => screen.getByRole('button', { name });

describe('InvoicePatientDetailsModal', () => {
  beforeEach(() => {
    formIsDirty = false;
    isLoadingPatient = false;
    resetForm.mockReset();
    put.mockReset().mockResolvedValue(undefined);
  });

  describe('its actions', () => {
    it('offers Cancel and Save when the details can be edited', () => {
      renderModal({ editable: true });

      expect(action('cancel')).toBeTruthy();
      expect(action('save')).toBeTruthy();
      expect(screen.queryByTestId('patient-details-close')).toBeNull();
    });

    // A single Close replaces both, so there is nothing offering to save what cannot be changed.
    it('offers only Close when the details are read-only', () => {
      renderModal({ editable: false });

      expect(action('close')).toBeTruthy();
      expect(screen.queryByTestId('patient-details-save')).toBeNull();
      expect(screen.queryByTestId('patient-details-cancel')).toBeNull();
    });
  });

  // An enabled Save over a form that has not mounted yet does nothing when pressed, with no
  // feedback, so the row waits for the form.
  describe('while the form is still loading', () => {
    it('offers no actions at all', () => {
      isLoadingPatient = true;
      renderModal();

      expect(screen.queryByTestId('patient-details-save')).toBeNull();
      expect(screen.queryByTestId('patient-details-cancel')).toBeNull();
      expect(screen.queryByTestId('patient-details-close')).toBeNull();
    });
  });

  describe('closing with no unsaved edits', () => {
    it.each(['cancel', 'close'])('closes straight away from %s', async name => {
      const { onClose } = renderModal({ editable: name === 'cancel' });

      fireEvent.click(action(name));

      expect(onClose).toHaveBeenCalled();
      expect(screen.queryByText('Unsaved changes')).toBeNull();
    });
  });

  describe('closing with unsaved edits', () => {
    beforeEach(() => {
      formIsDirty = true;
    });

    it('asks before discarding them rather than closing', () => {
      const { onClose } = renderModal();

      fireEvent.click(action('cancel'));

      expect(screen.getByText('Unsaved changes')).toBeTruthy();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('asks when the modal is dismissed with Escape', () => {
      const { onClose } = renderModal();

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });

      expect(screen.getByText('Unsaved changes')).toBeTruthy();
      expect(onClose).not.toHaveBeenCalled();
    });

    // The form stays mounted behind the prompt, so the edits are still there to go back to.
    it('keeps the form and does not close on Go back', () => {
      const { onClose } = renderModal();
      fireEvent.click(action('cancel'));

      fireEvent.click(button('Go back'));

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByTestId('form-body')).toBeTruthy();
    });

    it('closes on Discard changes', () => {
      const { onClose } = renderModal();
      fireEvent.click(action('cancel'));

      fireEvent.click(button('Discard changes'));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('saving', () => {
    it('updates the patient and reports the save to its caller', async () => {
      const { onSaved } = renderModal();

      fireEvent.click(action('save'));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      expect(put).toHaveBeenCalledWith(route('patient/:patientId', { patientId: 'patient-1' }), {
        firstName: 'Ada',
        facilityId: 'facility-1',
      });
    });

    // The caller may keep the modal up while it decides what comes next, and closing it then
    // would otherwise offer to discard edits that are already written.
    it('clears the form’s unsaved state once the save lands', async () => {
      const { onSaved } = renderModal();

      fireEvent.click(action('save'));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      expect(resetForm).toHaveBeenCalled();
    });

    it('does not clear it when the save was rejected', async () => {
      put.mockRejectedValue(new Error('nope'));
      renderModal();

      fireEvent.click(action('save'));

      await waitFor(() => expect(put).toHaveBeenCalled());
      expect(resetForm).not.toHaveBeenCalled();
    });

    // A failed save leaves the modal open on the details that did not save.
    it('does not report a save that the server rejected', async () => {
      put.mockRejectedValue(new Error('nope'));
      const { onSaved } = renderModal();

      fireEvent.click(action('save'));

      await waitFor(() => expect(put).toHaveBeenCalled());
      expect(onSaved).not.toHaveBeenCalled();
    });
  });
});
