import React, { useState } from 'react';
import EmailIcon from '@material-ui/icons/Email';
import { EmailAddressConfirmationForm } from '../../forms/EmailAddressConfirmationForm';
import { Button } from '..';
import { FormModal } from '../FormModal';
import { TranslatedText } from '../Translation/TranslatedText';

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
        data-test-id='button-eej2'>
        Email
      </Button>
      <FormModal
        title={<TranslatedText
          stringId="patient.email.title"
          fallback="Enter email address"
          data-test-id='translatedtext-mz16' />}
        open={openModal}
        onClose={() => setOpenModal(false)}
      >
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
