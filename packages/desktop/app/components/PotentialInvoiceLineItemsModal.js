import React from 'react';

import { useApi } from '../api';

import { Modal } from './Modal';
import { PotentialInvoiceLineItemsTable } from './PotentialInvoiceLineItemsTable';
import { ButtonRow } from './ButtonRow';
import { Button } from './Button';

export const PotentialInvoiceLineItemsModal = ({ open, onClose, invoiceId, onSaved }) => {
  const api = useApi();
  const handleSubmit = async () => api.post(`invoices/${invoiceId}/potentialInvoiceLineItems`);

  return (
    <Modal width="md" title="Potential invoice line items" open={open} onClose={onClose}>
      <PotentialInvoiceLineItemsTable invoiceId={invoiceId} />
      <ButtonRow>
        <Button variant="contained" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={async () => {
            await handleSubmit();
            await onSaved();
          }}
          color="primary"
        >
          Create
        </Button>
      </ButtonRow>
    </Modal>
  );
};
