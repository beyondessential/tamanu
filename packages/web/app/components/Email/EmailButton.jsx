import React, { useState } from 'react';
import { Button } from '@tamanu/ui-components';
import EmailIcon from '@material-ui/icons/Email';
import { EmailAddressConfirmationForm } from '../../forms/EmailAddressConfirmationForm';
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
        startIcon={<EmailIcon data-testid="emailicon-7w1w" />}
        size="small"
        data-testid="button-6qgc"
      >
        Email
      </Button>
      <FormModal
        title={
          <TranslatedText
            stringId="patient.email.title"
            fallback="Enter email address"
            data-testid="translatedtext-2nar"
          />
        }
        open={openModal}
        onClose={() => setOpenModal(false)}
        data-testid="formmodal-4vq0"
      >
        <EmailAddressConfirmationForm
          onSubmit={async (data) => {
            if (!openModal) return;
            await onEmail(data);
            setOpenModal(false);
          }}
          onCancel={() => setOpenModal(false)}
          data-testid="emailaddressconfirmationform-a6dk"
        />
      </FormModal>
    </>
  );
};
