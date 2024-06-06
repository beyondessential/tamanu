import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import { Modal } from './Modal';
import { TranslatedText } from './Translation';
import { useApi } from '../api';
import { useAuth } from '../contexts/Auth';
import { InvoiceManualDiscountForm } from './CreateInvoiceModal/InvoiceManualDiscountForm';

export const InvoiceManualDiscountModal = React.memo(
  ({
    open,
    onClose,
    invoiceId,
    priceChangeId,
    description,
    percentageChange
  }) => {
    const api = useApi();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();

    const handleSubmit = async data => {
      const percentageChange = -Math.abs(data.percentageChange / 100);
      const payload = {
        description: data.reason,
        percentageChange,
        orderedById: currentUser.id,
        date: getCurrentDateString(),
      };
      if (priceChangeId) {
        await api.put(`invoices/${invoiceId}/priceChangeItems/${priceChangeId}`, payload);
      } else {
        await api.post(`invoices/${invoiceId}/priceChangeItems/`, payload);
      }
      queryClient.invalidateQueries({ queryKey: ['priceChangeItems', invoiceId] })
      onClose();
    };
    
    return (
      <Modal
        width="sm"
        title={<TranslatedText stringId="invoice.action.create" fallback="Create invoice" />}
        open={open}
        onClose={onClose}
      >
        <InvoiceManualDiscountForm 
          handleSubmit={handleSubmit}
          description={description}
          percentageChange={percentageChange}
          priceChangeId={priceChangeId}
          onClose={onClose}
        />
      </Modal>
    );
  },
);
