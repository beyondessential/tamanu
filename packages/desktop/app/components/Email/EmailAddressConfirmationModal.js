import React from 'react';

import { Modal } from '../Modal';

import { EmailAddressConfirmationForm } from '../../forms/EmailAddressConfirmationForm';

export const EmailAddressConfirmationModal = React.memo(({ open, onClose, onEmail }) => {
  return (
    <Modal title="Enter email address" open={open} onClose={onClose}>
      <EmailAddressConfirmationForm onSubmit={onEmail} onCancel={onClose} />
    </Modal>
  );
});
