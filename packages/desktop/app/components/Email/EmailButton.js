import React, { useState } from 'react';
import EmailIcon from '@material-ui/icons/Email';
import { EmailAddressConfirmationForm } from '../../forms/EmailAddressConfirmationForm';
import { Button } from '..';
import { FormModal } from '../FormModal';

export const EmailButton = ({ onEmail }) => {
  const [openModal, setOpenModal] = useState(false);
  return (
    <>
      <Button
        color="primary"
        variant="outlined"
        onClick={() => {
          setOpenModal(true);
        }}
        startIcon={<EmailIcon />}
        size="small"
      >
        Email
      </Button>
      <FormModal title="Enter email address" open={openModal} onClose={() => setOpenModal(false)}>
        <EmailAddressConfirmationForm
          onSubmit={async data => {
            if (!openModal) return;
            await onEmail(data);
            setOpenModal(false);
          }}
          onCancel={() => setOpenModal(false)}
        />
      </FormModal>
    </>
  );
};
