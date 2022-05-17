import React from 'react';

import { Modal } from '../Modal';

import { EmailAddressConfirmationForm } from '../../forms/EmailAddressConfirmationForm';

export const EmailAddressConfirmationModal = React.memo(({ open, onClose, onEmail }) => (
  <Modal title="Enter email address" open={open} onClose={onClose}>
    <EmailAddressConfirmationForm
      onSubmit={data => {
        onEmail(data);
        onClose(data);
      }}
      onCancel={onClose}
    />
  </Modal>
));
