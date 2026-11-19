import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import {
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_PRINT_LAYOUTS,
} from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../../helpers';

const loadedQuery = data => ({ data, isFetching: false, isError: false });

const mocks = vi.hoisted(() => ({
  a4Printout: vi.fn(() => <div data-testid="a4-printout" />),
  receiptPrintout: vi.fn(() => <div data-testid="receipt-printout" />),
  usePatientAdditionalDataQuery: vi.fn(),
  useReferenceDataQuery: vi.fn(),
}));

vi.mock('@tamanu/shared/utils/patientCertificates', () => ({
  InvoiceRecordPrintout: mocks.a4Printout,
  InvoiceReceiptPrintout: mocks.receiptPrintout,
}));

// Rendering the PDF itself is out of scope here; the printout components are stubbed above.
vi.mock('../../../app/components/PatientPrinting/PDFLoader', () => ({
  PDFLoader: ({ children }) => children,
  printPDF: () => {},
}));

vi.mock('../../../app/utils/useCertificate', () => ({
  useCertificate: () => loadedQuery({ title: 'Facility', subTitle: 'Address' }),
}));
vi.mock('../../../app/api/queries/usePatientDataQuery', () => ({
  usePatientDataQuery: () =>
    loadedQuery({ id: 'patient-1', displayId: 'ABC123', villageId: 'village-1' }),
}));
vi.mock('../../../app/api/queries/usePatientAdditionalDataQuery', () => ({
  usePatientAdditionalDataQuery: mocks.usePatientAdditionalDataQuery,
}));
vi.mock('../../../app/api/queries/useReferenceDataQuery', () => ({
  useReferenceDataQuery: mocks.useReferenceDataQuery,
}));
vi.mock('../../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ encounter: { id: 'encounter-1' } }),
}));

const { SettingsContext, DateTimeProviderContext } = await import('@tamanu/ui-components');
const { InvoiceRecordModal } =
  await import('../../../app/components/PatientPrinting/modals/InvoiceRecordModal');

const BED_FEE_SOURCE_TYPE = INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE];

const invoice = {
  id: 'invoice-1',
  encounter: { patientId: 'patient-1' },
  items: [
    { id: 'item-1', quantity: 1 },
    { id: 'zeroed-bed-fee', quantity: 0, sourceRecordType: BED_FEE_SOURCE_TYPE },
  ],
};

const translations = { 'general.localisedField.displayId.label': 'NHN' };

const translationContext = {
  getTranslation: (_stringId, fallback) => fallback,
  getEnumTranslation: (enumValues, value) => enumValues[value] ?? value,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations,
};

const renderModal = settings =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider value={{ getSetting: key => settings[key] }}>
      <DateTimeProviderContext.Provider value={{ primaryTimeZone: 'Pacific/Auckland' }}>
        <InvoiceRecordModal open onClose={() => {}} invoice={invoice} />
      </DateTimeProviderContext.Provider>
    </SettingsContext.Provider>,
    undefined,
    translationContext,
  );

const printedItemIds = printout => printout.mock.lastCall[0].invoice.items.map(item => item.id);

describe('InvoiceRecordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usePatientAdditionalDataQuery.mockReturnValue(loadedQuery({}));
    mocks.useReferenceDataQuery.mockReturnValue(loadedQuery(null));
  });

  it('prints the A4 layout when the facility uses A4', () => {
    renderModal({ 'invoicing.printLayout': INVOICE_PRINT_LAYOUTS.A4 });
    expect(screen.getByTestId('a4-printout')).toBeTruthy();
    expect(screen.queryByTestId('receipt-printout')).toBeNull();
  });

  it('prints the A4 layout when no layout is set', () => {
    renderModal({});
    expect(screen.getByTestId('a4-printout')).toBeTruthy();
  });

  it('prints the receipt layout when the facility uses receipts', () => {
    renderModal({ 'invoicing.printLayout': INVOICE_PRINT_LAYOUTS.RECEIPT });
    expect(screen.getByTestId('receipt-printout')).toBeTruthy();
    expect(screen.queryByTestId('a4-printout')).toBeNull();
  });

  it.each([
    ['A4', INVOICE_PRINT_LAYOUTS.A4, mocks.a4Printout],
    ['receipt', INVOICE_PRINT_LAYOUTS.RECEIPT, mocks.receiptPrintout],
  ])('leaves zeroed bed-fee lines off the %s layout', (_name, printLayout, printout) => {
    renderModal({ 'invoicing.printLayout': printLayout });
    expect(printedItemIds(printout)).toEqual(['item-1']);
  });

  it.each([
    ['A4', INVOICE_PRINT_LAYOUTS.A4, mocks.a4Printout],
    ['receipt', INVOICE_PRINT_LAYOUTS.RECEIPT, mocks.receiptPrintout],
  ])("prints the %s layout in the deployment's translations", (_name, printLayout, printout) => {
    renderModal({ 'invoicing.printLayout': printLayout });
    expect(printout.mock.lastCall[0].translations).toBe(translations);
  });

  it("fetches the patient's additional data and village for the A4 layout", () => {
    renderModal({ 'invoicing.printLayout': INVOICE_PRINT_LAYOUTS.A4 });
    expect(mocks.usePatientAdditionalDataQuery).toHaveBeenLastCalledWith('patient-1');
    expect(mocks.useReferenceDataQuery).toHaveBeenLastCalledWith('village-1');
  });

  it("doesn't fetch the patient's additional data or village for the receipt layout", () => {
    renderModal({ 'invoicing.printLayout': INVOICE_PRINT_LAYOUTS.RECEIPT });
    expect(mocks.usePatientAdditionalDataQuery).toHaveBeenLastCalledWith(null);
    expect(mocks.useReferenceDataQuery).toHaveBeenLastCalledWith(null);
  });
});
