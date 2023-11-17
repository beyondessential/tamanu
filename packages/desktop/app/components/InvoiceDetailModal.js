import React, { useState, useEffect, useCallback } from 'react';
import { INVOICE_STATUS_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useApi } from '../api';
import { getInvoiceTotal, calculateInvoiceTotal } from '../utils';
import { FormModal } from './FormModal';
import { InvoiceDetailForm } from '../forms/InvoiceDetailForm';

export const InvoiceDetailModal = ({ title, open, onClose, onUpdated, invoiceId }) => {
  const [invoice, setInvoice] = useState({});
  const api = useApi();

  const finaliseInvoice = useCallback(async () => {
    // LOCK IN the total when FINALISING an invoice
    const total = await getInvoiceTotal(api, invoiceId);
    await api.put(`invoices/${invoiceId}`, {
      status: INVOICE_STATUS_TYPES.FINALISED,
      total,
      date: getCurrentDateTimeString(),
    });
    onUpdated();
    onClose();
  }, [api, invoiceId, onClose, onUpdated]);

  const cancelInvoice = useCallback(async () => {
    // LOCK IN the total when CANCELLING an invoice
    const total = await getInvoiceTotal(api, invoiceId);
    await api.put(`invoices/${invoiceId}`, {
      status: INVOICE_STATUS_TYPES.CANCELLED,
      total,
    });
    onUpdated();
    onClose();
  }, [api, invoiceId, onClose, onUpdated]);

  const updateInvoice = useCallback(
    async data => {
      await api.put(`invoices/${invoiceId}`, {
        ...data,
      });
      onUpdated();
      onClose();
    },
    [api, invoiceId, onClose, onUpdated],
  );

  useEffect(() => {
    (async () => {
      const response = await api.get(`invoices/${invoiceId}`);
      const { data: invoiceLines } = await api.get(`invoices/${invoiceId}/lineItems`);
      const { data: invoicePriceChanges } = await api.get(`invoices/${invoiceId}/priceChangeItems`);
      const total = calculateInvoiceTotal(invoiceLines, invoicePriceChanges);
      setInvoice({
        ...response,
        admissionType: response.encounter.encounterType,
        total,
      });
    })();
  }, [api, invoiceId]);

  return (
    <FormModal width="md" title={title} open={open} onClose={onClose}>
      <InvoiceDetailForm
        onSubmit={updateInvoice}
        onFinaliseInvoice={finaliseInvoice}
        onCancelInvoice={cancelInvoice}
        onCancel={onClose}
        invoice={invoice}
      />
    </FormModal>
  );
};
