import React from 'react';
import { Modal, TranslatedText } from '@tamanu/ui-components';
import { InvoiceDiscountAssessmentForm } from './InvoiceDiscountAssessmentForm';

export const InvoiceDiscountModal = ({ open, onClose, invoice }) => {
  return (
    <Modal
      width="sm"
      title={
        <TranslatedText
          stringId="invoice.action.applySlidingFeeScale"
          fallback="Apply sliding fee scale"
        />
      }
      open={open}
      onClose={onClose}
    >
      <InvoiceDiscountAssessmentForm onClose={onClose} invoice={invoice} />
    </Modal>
  );
};
