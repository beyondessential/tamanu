import React from 'react';
import { Divider } from '@material-ui/core';
import styled from 'styled-components';
import { Modal } from '../Modal';
import { TranslatedText } from '../Translation';
import { FormSubmitCancelRow } from '../ButtonRow';
import { InvoiceItemDetailsCard } from '../InvoiceItemDetailsCard';

const StyledDivider = styled(Divider)`
  margin: 26px -32px 32px -32px;
`;

export const DeleteItemModal = React.memo(
  ({ open, onClose, onDelete, lineItems }) => {
    return (
      <Modal
        width="sm"
        title={<TranslatedText stringId="invoice.modal.deleteInvoiceItem.title" fallback="Delete item" />}
        open={open}
        onClose={onClose}
      >
        <InvoiceItemDetailsCard lineItems={lineItems} />
        <StyledDivider />
        <FormSubmitCancelRow
          confirmText={<TranslatedText stringId="general.action.confirm" fallback="Confirm" />}
          onConfirm={onDelete}
          onCancel={onClose}
        />
      </Modal>
    );
  },
);

DeleteItemModal.defaultProps = {
  open: false,
};
