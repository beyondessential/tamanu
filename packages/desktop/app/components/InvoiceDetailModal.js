import React, { useState, useEffect, useCallback } from 'react';

import { INVOICE_STATUS_TYPES } from 'shared/constants';
import { calculateInvoiceTotal } from 'shared/utils';

import { useApi } from '../api';
import { Modal } from './Modal';
import { InvoiceDetailForm } from '../forms/InvoiceDetailForm';

export const InvoiceDetailModal = ({ title, open, onClose, onSaved, invoiceId }) => {
  const [invoice, setInvoice] = useState({});
  const api = useApi();

  const handleFinaliseInvoice = useCallback(async () => {
    api.put(`invoices/${invoiceId}`, {
      status: INVOICE_STATUS_TYPES.FINALISED,
      date: new Date(),
    });
    onSaved();
  }, [invoiceId]);

  const handleCancelInvoice = useCallback(async () => {
    api.put(`invoices/${invoiceId}`, {
      status: INVOICE_STATUS_TYPES.CANCELLED,
    });
    onSaved();
  }, [invoiceId]);

  const handleSubmit = useCallback(
    async data => {
      api.put(`invoices/${invoiceId}`, {
        ...data,
      });
      onSaved();
    },
    [invoiceId],
  );

  useEffect(() => {
    (async () => {
      const response = await api.get(`invoices/${invoiceId}`);
      const { data: invoiceLines } = await api.get(`invoices/${invoiceId}/invoiceLineItems`);
      const { data: invoicePriceChanges } = await api.get(
        `invoices/${invoiceId}/invoicePriceChangeItems`,
      );
      const total = calculateInvoiceTotal(invoiceLines, invoicePriceChanges);
      setInvoice({
        ...response,
        admissionType: response.encounter.encounterType,
        total: `$${total}`,
      });
    })();
  }, []);

  return (
    <Modal width="md" title={title} open={open} onClose={onClose}>
      <InvoiceDetailForm
        onSubmit={handleSubmit}
        onFinaliseInvoice={handleFinaliseInvoice}
        onCancelInvoice={handleCancelInvoice}
        onCancel={onClose}
        invoice={invoice}
      />
    </Modal>
  );
};
