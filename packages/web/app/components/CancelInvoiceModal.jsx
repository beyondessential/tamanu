import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { Modal } from './Modal';
import { TranslatedText } from './Translation';
import { ModalActionRow } from './ModalActionRow';
import { getInvoiceTotal } from '../utils';
import { useApi } from '../api';
import { useEncounter } from '../contexts/Encounter';

const ContentText = styled.div`
  margin: 20px 18px 50px 18px;
`;

export const CancelInvoiceModal = React.memo(
  ({ open, onClose, invoiceId }) => {
    const api = useApi();
    const params = useParams();
    const { loadEncounter } = useEncounter();
    const cancelInvoice = useCallback(async () => {
      // LOCK IN the total when CANCELLING an invoice
      const total = await getInvoiceTotal(api, invoiceId);
      await api.put(`invoices/${invoiceId}`, {
        status: INVOICE_STATUSES.CANCELLED,
        total,
      });
      onClose();
      await loadEncounter(params.encounterId)
    }, [api, invoiceId, onClose]);
    return (
      <Modal
        width="sm"
        title={<TranslatedText stringId="invoice.modal.cancelInvoice.title" fallback="Cancel invoice" />}
        open={open}
        onClose={onClose}
      >
        <ContentText>
          <TranslatedText
            stringId="invoice.modal.cancelInvoice.content"
            fallback="Are you sure you would like to cancel this invoice? This cannot be undone."
          />
        </ContentText>
        <ModalActionRow
          onConfirm={cancelInvoice}
          onCancel={onClose}
        />
      </Modal>
    );
  },
);
