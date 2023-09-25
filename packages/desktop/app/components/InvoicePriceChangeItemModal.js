import React, { useState, useEffect, useCallback } from 'react';

import { useApi } from '../api';
import { FormModal } from './FormModal';
import { InvoicePriceChangeItemForm } from '../forms/InvoicePriceChangeItemForm';

const PRICE_CHANGE_ITEM_INITIAL_VALUES = {
  percentageChange: 0,
};

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
  const [invoicePriceChangeItem, setInvoicePriceChangeItem] = useState(
    PRICE_CHANGE_ITEM_INITIAL_VALUES,
  );

  const handleSubmit = useCallback(
    async data => {
      const convertedPriceChange = data.percentageChange / 100;
      if (invoicePriceChangeItemId) {
        api.put(`invoices/${invoiceId}/priceChangeItems/${invoicePriceChangeItemId}`, {
          ...data,
          percentageChange: convertedPriceChange,
        });
      } else {
        api.post(`invoices/${invoiceId}/priceChangeItems`, {
          ...data,
          percentageChange: convertedPriceChange,
        });
      }
      onSaved();
    },
    [api, invoiceId, invoicePriceChangeItemId, onSaved],
  );

  useEffect(() => {
    if (invoicePriceChangeItemId) {
      (async () => {
        const response = await api.get(
          `invoices/${invoiceId}/priceChangeItems/${invoicePriceChangeItemId}`,
        );
        setInvoicePriceChangeItem({
          ...response,
          percentageChange: response.percentageChange * 100,
        });
      })();
    }
  }, [api, invoiceId, invoicePriceChangeItemId]);

  return (
    <FormModal width="md" title={title} open={open} onClose={onClose}>
      <InvoicePriceChangeItemForm
        actionText={actionText}
        onSubmit={handleSubmit}
        onCancel={onClose}
        invoiceId={invoiceId}
        invoicePriceChangeItem={invoicePriceChangeItem}
      />
    </FormModal>
  );
};
