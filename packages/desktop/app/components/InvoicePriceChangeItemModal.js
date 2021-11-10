import React, { useState, useEffect, useCallback } from 'react';

import { useApi } from '../api';
import { Modal } from './Modal';
import { InvoicePriceChangeItemForm } from '../forms/InvoicePriceChangeItemForm';

export const InvoicePriceChangeItemModal = ({
  title,
  actionText,
  open,
  onClose,
  onSaved,
  invoiceId,
  invoicePriceChangeItemId,
}) => {
  const api = useApi();
  const [invoicePriceChangeItem, setInvoicePriceChangeItem] = useState({});

  const handleSubmit = useCallback(
    async data => {
      const convertedPriceChange = data.percentageChange / 100;
      if (invoicePriceChangeItemId) {
        api.put(`invoices/${invoiceId}/invoicePriceChangeItems/${invoicePriceChangeItemId}`, {
          ...data,
          percentageChange: convertedPriceChange,
        });
      } else {
        api.post(`invoices/${invoiceId}/invoicePriceChangeItems`, {
          ...data,
          percentageChange: convertedPriceChange,
        });
      }
      onSaved();
    },
    [invoiceId, invoicePriceChangeItemId],
  );

  useEffect(() => {
    if (invoicePriceChangeItemId) {
      (async () => {
        const response = await api.get(
          `invoices/${invoiceId}/invoicePriceChangeItems/${invoicePriceChangeItemId}`,
        );
        setInvoicePriceChangeItem({
          ...response,
          percentageChange: response.percentageChange * 100,
        });
      })();
    }
  }, []);

  return (
    <Modal width="md" title={title} open={open} onClose={onClose}>
      <InvoicePriceChangeItemForm
        actionText={actionText}
        onSubmit={handleSubmit}
        onCancel={onClose}
        invoiceId={invoiceId}
        invoicePriceChangeItem={invoicePriceChangeItem}
      />
    </Modal>
  );
};
