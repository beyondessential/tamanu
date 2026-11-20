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

const coveredItem = (invoiceSectionId, coverageValue) => ({
  id: `item-${invoiceSectionId}-${coverageValue}`,
  invoiceSectionId,
  quantity: 1,
  manualEntryPrice: 100,
  productId: 'product-1',
  product: { name: 'Consultation', insurable: true },
  insurancePlanItems: [{ id: 'plan-1', coverageValue }],
});

const emergency = { invoiceSectionId: 'section-emergency', code: 'emergency', name: 'Emergency' };
const inpatient = { invoiceSectionId: 'section-inpatient', code: 'inpatient', name: 'Inpatient' };

const renderSplitPanel = (sections, items) =>
  renderElementWithTranslatedText(
    <InvoiceSummaryPanel invoice={{ id: 'invoice-1', status: 'in_progress', sections, items }} />,
  );

describe('InvoiceSummaryPanel insurance coverage', () => {
  it('shows one coverage line, unnamed, on an invoice with nothing to tell apart', () => {
    renderSplitPanel([emergency], [coveredItem('section-emergency', 50)]);

    expect(screen.getByTestId('invoice-summary-insuranceTotal').textContent).toBe('-50.00');
    expect(screen.queryByTestId('invoice-summary-insuranceTotal-section-emergency')).toBeNull();
  });

  it('names each section on a split invoice, and keeps their shares apart', () => {
    renderSplitPanel(
      [emergency, inpatient],
      [coveredItem('section-emergency', 50), coveredItem('section-inpatient', 20)],
    );

    expect(screen.getByText('Insurance coverage (Emergency)')).toBeDefined();
    expect(screen.getByText('Insurance coverage (Inpatient)')).toBeDefined();
    expect(
      screen.getByTestId('invoice-summary-insuranceTotal-section-emergency').textContent,
    ).toBe('-50.00');
    expect(
      screen.getByTestId('invoice-summary-insuranceTotal-section-inpatient').textContent,
    ).toBe('-20.00');
  });

  it('shows a section carrying no coverage rather than leaving it out', () => {
    renderSplitPanel(
      [emergency, inpatient],
      [coveredItem('section-emergency', 50), { ...coveredItem('section-inpatient', 0), insurancePlanItems: [] }],
    );

    expect(
      screen.getByTestId('invoice-summary-insuranceTotal-section-inpatient').textContent,
    ).toBe('0.00');
  });

  it('keeps coverage on an item carrying no section on the plain line, so it is not dropped', () => {
    renderSplitPanel(
      [emergency, inpatient],
      [coveredItem('section-emergency', 50), coveredItem(null, 15)],
    );

    expect(screen.getByTestId('invoice-summary-insuranceTotal').textContent).toBe('-15.00');
  });

  it('leaves the patient subtotal following from the lines above it', () => {
    renderSplitPanel(
      [emergency, inpatient],
      [coveredItem('section-emergency', 50), coveredItem('section-inpatient', 20)],
    );

    // Two items at 100, covered by 50 and 20
    expect(screen.getByTestId('invoice-summary-patientSubtotal').textContent).toBe('130.00');
  });
});
