import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderElementWithTranslatedText } from '../../helpers/render';

vi.mock('../../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: () => true }),
}));

vi.mock('../../../app/api/mutations/useInvoiceMutation', () => ({
  useUpdateInvoice: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../../../app/features/Invoice/InvoiceDiscountModal/InvoiceDiscountModal', () => ({
  InvoiceDiscountModal: () => null,
}));

// Imported after the mocks so the component picks them up
const { InvoiceSummaryPanel } = await import('../../../app/features/Invoice/InvoiceSummaryPanel');

const buildInvoice = discount => ({
  id: 'invoice-1',
  status: 'in_progress',
  items: [
    {
      id: 'item-1',
      quantity: 1,
      priceFinal: 100,
      productId: 'product-1',
      product: { name: 'Consultation' },
    },
  ],
  discount,
});

const renderPanel = discount =>
  renderElementWithTranslatedText(<InvoiceSummaryPanel invoice={buildInvoice(discount)} />);

describe('InvoiceSummaryPanel discount reason', () => {
  it('shows the reason a cashier recorded against a manual discount', () => {
    renderPanel({ percentage: 0.2, isManual: true, reason: 'Hardship case' });

    expect(screen.getByTestId('invoice-summary-discountReason').textContent).toBe('Hardship case');
  });

  it('names the assessment as the reason for a sliding fee scale discount', () => {
    renderPanel({ percentage: 0.2, isManual: false });

    expect(screen.getByTestId('invoice-summary-discountReason').textContent).toBe(
      'Based on patient assessment',
    );
  });

  it('shows no reason when a manual discount was recorded without one', () => {
    renderPanel({ percentage: 0.2, isManual: true });

    expect(screen.queryByTestId('invoice-summary-discountReason')).toBeNull();
  });

  it('shows no reason when the invoice has no discount', () => {
    renderPanel(null);

    expect(screen.queryByTestId('invoice-summary-discountReason')).toBeNull();
  });
});
