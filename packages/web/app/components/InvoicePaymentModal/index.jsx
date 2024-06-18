import React from 'react';
import styled from 'styled-components';
import { Modal } from '../Modal';
import { TranslatedText } from '../Translation';
import { InvoiceStatus } from '../InvoiceStatus';
import { InvoiceItemHeader, InvoiceItemRow } from './InvoiceItemRow';
import { Box } from '@material-ui/core';
import { InvoiceSummaryPanel } from '../InvoiceSummaryPanel';
import { PatientPaymentsTable } from './patientPaymentsTable';
import { InsurerPaymentsTable } from './InsurerPaymentsTable';

const StatusContainer = styled.span`
  margin-left: 20px;
  font-weight: 400;
`;

export const InvoicePaymentModal = ({
  open,
  onClose,
  invoice,
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
