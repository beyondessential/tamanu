import React from 'react';
import styled from 'styled-components';
import { Modal } from '../Modal';
import { TranslatedText } from '../Translation';
import { InvoiceStatus } from '../InvoiceStatus';
import { InvoiceItemHeader, InvoiceItemRow } from './InvoiceItemRow';
import { Box } from '@material-ui/core';
import { InvoiceSummaryPanel } from '../InvoiceSummaryPanel';
import { Colors } from '../../constants';
import { PatientPaymentsTable } from './patientPaymentsTable';
import { InsurerPaymentsTable } from './InsurerPaymentsTable';

const invoiceMock = {
  "id": "e9c6dc66-4ce1-43e4-a48a-c73742c48b51",
  "displayId": "80193542LK",
  "status": "in_progress",
  "paymentStatus": "unpaid",
  "updatedAtSyncTick": "114",
  "createdAt": "2024-06-13T15:45:37.530Z",
  "updatedAt": "2024-06-13T15:45:37.530Z",
  "encounterId": "bed8381f-cc36-4dd8-a67d-f78075fb839f",
  "items": [
    {
      "id": "invoice-item-id1",
      "orderDate": "2024-06-13T15:45:37.530Z",
      "productId": "invoice-product-id1",
      "productName": "Breakfast",
      "productPrice": "20",
      "updatedAtSyncTick": "182",
      "createdAt": "2024-06-13T15:45:37.530Z",
      "updatedAt": "2024-06-13T15:45:37.530Z",
      "invoiceId": "e9c6dc66-4ce1-43e4-a48a-c73742c48b51",
      "orderedByUserId": "194051b3-1110-49e9-996c-5733a4a50a78"
    }
  ]
}

const StatusContainer = styled.span`
  margin-left: 20px;
  font-weight: 400;
`;

const PATIENT_PAYMENTS_COLUMNS = [
  {
    key: 'date',
    title: <TranslatedText stringId="general.date.label" fallback="Date" />,
    sortable: false,
  },
  {
    key: 'method',
    title: <TranslatedText stringId="invoice.table.payment.column.method" fallback="Method" />,
    sortable: false,
  },
  {
    key: 'amount',
    title: <TranslatedText stringId="invoice.table.payment.column.amount" fallback="Amount" />,
    sortable: false,
  },
  {
    key: 'receiptNumber',
    title: (
      <TranslatedText
        stringId="invoice.table.payment.column.receiptNumber"
        fallback="Receipt number"
      />),
    sortable: false,
  },
];

export const InvoicePaymentModal = ({
  open,
  onClose,
  invoice = invoiceMock,
}) => {
  return (
    <Modal
      width="lg"
      title={
        <>
          <TranslatedText
            stringId="invoice.modal.view.title"
            fallback="Invoice number: :invoiceNumber"
            replacements={{ invoiceNumber: invoice?.displayId }}
          />
          <StatusContainer>
            <InvoiceStatus status={invoice?.invoiceStatus} />
          </StatusContainer>
        </>
      }
      open={open}
      onClose={onClose}
      overrideContentPadding
    >
      <Box sx={{ padding: '12px 40px' }}>
        <Box sx={{ marginLeft: 4, marginRight: 4 }}>
          <InvoiceItemHeader />
          {invoice.items && invoice.items.map(item => (
            <InvoiceItemRow invoiceItem={item} />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 14 }}>
          <Box sx={{ flex: 2 }}>
            <PatientPaymentsTable />
            <InsurerPaymentsTable />
          </Box>
          <InvoiceSummaryPanel invoice={invoice} />
        </Box>
      </Box>
    </Modal>
  );
};
