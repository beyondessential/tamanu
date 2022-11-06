import React, { useState } from 'react';
import EmailIcon from '@material-ui/icons/Email';
import { EmailAddressConfirmationModal } from './EmailAddressConfirmationModal';
import { Button } from '..';

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
      <EmailAddressConfirmationModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onEmail={onEmail}
      />
    </>
  );
};
