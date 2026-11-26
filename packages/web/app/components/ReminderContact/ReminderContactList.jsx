import React from 'react';

import { ModalCancelRow } from '../ModalActionRow';
import { TranslatedText } from '../Translation/TranslatedText';
import { ContactDetails } from './ContactDetails';

export const ReminderContactList = ({ onClose, onRemoveContact }) => {
  return (
    <>
      <ContactDetails onRemoveContact={onRemoveContact} data-testid="contactdetails-6in2" />
      <ModalCancelRow
        confirmText={
          <TranslatedText
            stringId="general.action.close"
            fallback="Close"
            data-testid="translatedtext-cirh"
          />
        }
        confirmColor="primary"
        onConfirm={onClose}
        data-testid="modalcancelrow-hpiv"
      />
    </>
  );
};
