import React, { useState, useEffect, useCallback } from 'react';

import { useApi } from '../api';

import { Modal } from './Modal';
import { InvoiceLineItemForm } from '../forms/InvoiceLineItemForm';

export const InvoiceLineItemModal = ({
  title,
  actionText,
  open,
  onClose,
  onSaved,
  invoiceId,
  invoiceLineItemId,
}) => {
  const [invoiceLineItem, setInvoiceLineItem] = useState({});
  const api = useApi();

  const handleSubmit = useCallback(
    async data => {
      const invoiceLineItemData = {
        ...data,
        percentageChange: data.percentageChange ? data.percentageChange / 100 : undefined,
      };

      if (invoiceLineItemId) {
        api.put(`invoices/${invoiceId}/invoiceLineItems/${invoiceLineItemId}`, invoiceLineItemData);
      } else {
        api.post(`invoices/${invoiceId}/invoiceLineItems`, invoiceLineItemData);
      }
      onSaved();
    },
    [invoiceId, invoiceLineItemId],
  );

  useEffect(() => {
    if (invoiceLineItemId) {
      (async () => {
        const response = await api.get(
          `invoices/${invoiceId}/invoiceLineItems/${invoiceLineItemId}`,
        );
        setInvoiceLineItem({
          ...response,
          price: response.invoiceLineType.price,
          percentageChange: response.percentageChange * 100,
        });
      })();
    }
  }, []);
  return (
    <Modal width="md" title={title} open={open} onClose={onClose}>
      <InvoiceLineItemForm
        actionText={actionText}
        onSubmit={handleSubmit}
        onCancel={onClose}
        invoiceId={invoiceId}
        editedObject={invoiceLineItem}
      />
    </Modal>
  );
};
