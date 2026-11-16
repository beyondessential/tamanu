import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderElementWithTranslatedText } from '../../helpers/render';

const mutate = vi.fn();

vi.mock('../../../app/api/mutations/useInvoiceMutation', () => ({
  useInvoiceInsurancePlansMutation: () => ({ mutate }),
}));

vi.mock('../../../app/api/queries', () => ({
  usePatientAvailableInsurancePlansQuery: () => ({
    data: [{ id: 'plan-1' }],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

// The suggester field reaches the API, and this is about which plans the window starts on and
// what it sends, so it stands in as a plain record of its value.
vi.mock('../../../app/components/Field', () => ({
  SuggesterSelectField: ({ field }) => (
    <span data-testid="selected-plans">{(field.value ?? []).join(',')}</span>
  ),
}));

const { InvoiceInsuranceModal } =
  await import('../../../app/features/Invoice/InvoiceInsuranceModal');

const EMERGENCY = { invoiceSectionId: 'section-emergency', name: 'Emergency' };

const invoice = {
  id: 'invoice-1',
  encounterId: 'encounter-1',
  encounter: { patientId: 'patient-1' },
  insurancePlans: [
    { id: 'plan-1', attachmentId: 'attachment-1', invoiceSectionId: 'section-emergency' },
    { id: 'plan-2', attachmentId: 'attachment-2', invoiceSectionId: 'section-inpatient' },
    { id: 'plan-3', attachmentId: 'attachment-3', invoiceSectionId: null },
  ],
};

const renderModal = section =>
  renderElementWithTranslatedText(
    <InvoiceInsuranceModal open invoice={invoice} section={section} onClose={vi.fn()} />,
  );

describe('InvoiceInsuranceModal', () => {
  beforeEach(() => mutate.mockClear());

  it('starts on the plans attached to the section it was opened from', () => {
    renderModal(EMERGENCY);

    expect(screen.getByTestId('selected-plans').textContent).toBe('plan-1');
  });

  it('starts on the plans covering the whole invoice when opened without a section', () => {
    renderModal(undefined);

    expect(screen.getByTestId('selected-plans').textContent).toBe('plan-3');
  });

  it('sends the section it was opened from', () => {
    renderModal(EMERGENCY);
    fireEvent.click(screen.getByText('Confirm'));

    expect(mutate).toHaveBeenCalledWith(
      { invoiceInsurancePlanIds: ['plan-1'], invoiceSectionId: 'section-emergency' },
      expect.anything(),
    );
  });

  it('sends no section when opened without one', () => {
    renderModal(undefined);
    fireEvent.click(screen.getByText('Confirm'));

    expect(mutate).toHaveBeenCalledWith(
      { invoiceInsurancePlanIds: ['plan-3'], invoiceSectionId: null },
      expect.anything(),
    );
  });
});
