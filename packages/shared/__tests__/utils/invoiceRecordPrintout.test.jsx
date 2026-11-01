import React from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES,
  INVOICE_ITEMS_DISCOUNT_TYPES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
  INVOICE_STATUSES,
} from '@tamanu/constants';
import { InvoiceRecordPrintout } from '../../src/utils/patientCertificates/InvoiceRecordPrintout';

// react-pdf's primitives are host components, so rendering the document with react-dom gives a
// tree whose text can be read straight off — a rendered PDF compresses its text streams.
const renderText = (props, translations) =>
  renderToStaticMarkup(<InvoiceRecordPrintout {...props} translations={translations} />).replace(
    /<[^>]*>/g,
    ' ',
  );

const PATIENT = {
  displayId: 'ABC123',
  firstName: 'Ada',
  lastName: 'Lovelace',
  additionalData: { insurer: { name: 'Pacific Health' }, insurerPolicyNumber: 'POL-9' },
};

const ENCOUNTER = {
  encounterType: 'admission',
  startDate: '2026-01-05 09:00:00',
  endDate: '2026-01-07 09:00:00',
  location: { facility: { name: 'Test Facility' } },
  department: { name: 'General' },
  diagnoses: [],
};

const ITEM = {
  id: 'item-1',
  orderDate: '2026-01-05',
  quantity: 2,
  approved: true,
  note: 'Take with food',
  orderedByUser: { displayName: 'Dr Jane' },
  product: { name: 'Paracetamol', insurable: true, invoicePriceListItem: { price: 100 } },
  // Drives the "Item adjustment" / "Cost after adjustment" sub-rows.
  discount: { type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE, amount: 0.1 },
};

const PAYMENTS = [
  {
    id: 'payment-1',
    date: '2026-01-06',
    amount: 20,
    receiptNumber: 'RCPT-1',
    patientPayment: { id: 'patient-payment-1', method: { name: 'Cash' } },
  },
  {
    id: 'payment-2',
    date: '2026-01-07',
    amount: 5,
    receiptNumber: 'RCPT-2',
    patientPayment: { id: 'patient-payment-2', method: { name: 'Cash' } },
    refundPayment: { id: 'refund-1' },
  },
  {
    id: 'payment-3',
    date: '2026-01-08',
    amount: 15,
    receiptNumber: 'RCPT-3',
    insurancePlanPayment: {
      id: 'insurance-payment-1',
      status: INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.REJECTED,
      reason: 'Outside cover',
      insurancePlan: { name: 'Gold plan' },
    },
  },
];

const baseProps = {
  patientData: PATIENT,
  encounter: ENCOUNTER,
  certificateData: {},
  getSetting: () => undefined,
  primaryTimeZone: 'Pacific/Auckland',
  invoice: {
    displayId: 'INV-001',
    date: '2026-01-05',
    status: INVOICE_STATUSES.IN_PROGRESS,
    patientPaymentStatus: INVOICE_PATIENT_PAYMENT_STATUSES.PARTIAL,
    insurancePlanPaymentStatus: INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.REJECTED,
    priceList: { name: 'Standard' },
    insurancePlans: [{ id: 'plan-1', name: 'Gold plan', code: 'GOLD' }],
    items: [ITEM],
    payments: PAYMENTS,
  },
};

const TITLE_STRING_ID = 'pdf.invoiceRecord.title';

// The strings the printout body writes, as stringId to the English it falls back to. The
// sub-sections it composes (patient, encounter and invoice details) carry their own labels.
const PRINTOUT_STRINGS = {
  [TITLE_STRING_ID]: 'Invoice number: INV-001',
  'general.date.label': 'Date',
  'invoice.modal.editInvoice.details.label': 'Details',
  'invoice.modal.editInvoice.quantity.label': 'Quantity',
  'invoice.modal.editInvoice.approved.label': 'Approved',
  'invoice.modal.editInvoice.orderedBy.label': 'Ordered by',
  'invoice.modal.editInvoice.cost.label': 'Cost',
  'invoice.modal.editInvoice.netCost.label': 'Net cost',
  'invoice.modal.editInvoice.note.label': 'Note',
  'invoice.table.column.insurance': 'Insurance',
  'invoice.itemAdjustment.label': 'Item adjustment',
  'invoice.costAfterAdjustment.label': 'Cost after adjustment',
  'invoice.summary.invoiceTotal': 'Invoice total',
  'invoice.summary.itemAdjustments': 'Item adjustments',
  'invoice.summary.insuranceTotal': 'Insurance coverage',
  'invoice.summary.patientSubtotal': 'Patient subtotal',
  'invoice.summary.patientPayments': 'Patient payments',
  'invoice.summary.patientTotal': 'Patient total due',
  'invoice.table.payment.column.method': 'Method',
  'invoice.table.payment.column.amount': 'Amount',
  'invoice.table.payment.column.receiptNumber': 'Receipt number',
  'invoice.table.payment.column.payer': 'Payer',
  'invoice.table.payment.column.remainingBalance': 'Remaining balance',
  'invoice.table.payment.column.status': 'Status',
  'invoice.paymentStatus.paid': 'Paid',
  'invoice.paymentStatus.refunded': 'Refunded',
  'invoice.property.insurancePlanPaymentStatus.rejected': 'Rejected',
  'invoice.property.status.in_progress': 'In progress',
  'invoice.property.patientPaymentStatus.partial': 'Partial',
  'encounter.property.type.admission': 'Hospital admission',
};

// The payment table headings (pdf.invoiceRecord.patientPayment.title,
// pdf.invoiceRecord.insurancePlanPayment.title and the pdf.heading.contentContinued suffix) go
// through react-pdf's `render` callback so they can say "cont..." on later pages. react-dom
// never calls it, so they are translated the same way as everything above but can't be read
// back here.

describe('InvoiceRecordPrintout translations', () => {
  // react-dom warns on every one of react-pdf's non-DOM elements and props; the markup it
  // returns is still what these assertions read.
  let consoleError;
  beforeAll(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => consoleError.mockRestore());

  it('falls back to English when a deployment has no translations', () => {
    const text = renderText(baseProps, {});
    for (const english of Object.values(PRINTOUT_STRINGS)) {
      expect(text).toContain(english);
    }
  });

  it('uses the deployment translation for every string it writes', () => {
    const translations = Object.fromEntries(
      Object.keys(PRINTOUT_STRINGS).map(stringId => [
        stringId,
        stringId === TITLE_STRING_ID ? 'TRANSLATED :invoiceNumber' : `TRANSLATED ${stringId}`,
      ]),
    );
    const text = renderText(baseProps, translations);

    expect(text).toContain('TRANSLATED INV-001');
    for (const stringId of Object.keys(PRINTOUT_STRINGS)) {
      if (stringId === TITLE_STRING_ID) continue;
      expect(text).toContain(`TRANSLATED ${stringId}`);
    }
  });

  it('labels the patient-level insurer with the same string as the patient details screen', () => {
    const props = {
      ...baseProps,
      invoice: { ...baseProps.invoice, insurancePlans: [] },
      enablePatientInsurer: true,
    };

    expect(renderText(props, {})).toContain('Insurer');
    expect(
      renderText(props, { 'general.localisedField.insurer.label': 'TRANSLATED insurer' }),
    ).toContain('TRANSLATED insurer');
  });
});
