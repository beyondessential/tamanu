import React from 'react';
import styled from 'styled-components';

import { PlusIcon } from '../../assets/icons/PlusIcon';
import { Colors } from '../../constants';
import { useAuth } from '../../contexts/Auth';
import { Button } from '../Button';
import { ModalCancelRow } from '../ModalActionRow';
import { TranslatedText } from '../Translation/TranslatedText';
import { ContactDetails } from './ContactDetails';

const StyledAddContactButton = styled(Button)`
  padding: 11px 15px !important;
  height: 33px;
  border-radius: 3px;
  border: 1px solid ${Colors.primary};
  line-height: 18px;
  margin-bottom: 20px;

  svg {
    margin-right: 5px !important;
  }
`;

export const ReminderContactList = ({ onClose, onAddContact, pendingContacts, onRetry, successContactIds, onRemoveContact }) => {
  const { ability } = useAuth();
  const canAddReminderContacts = ability.can('write', 'Patient');

  return (
    <>
      <ContactDetails
        pendingContacts={pendingContacts}
        onRetry={onRetry}
        successContactIds={successContactIds}
        onRemoveContact={onRemoveContact}
      />
      {canAddReminderContacts && (
        <StyledAddContactButton
          variant="outlined"
          color="primary"
          size="small"
          onClick={onAddContact}
        >
          <PlusIcon fill={Colors.primary} />
          <TranslatedText
            stringId="patient.details.reminderContacts.action.add"
            fallback="Add contact"
            data-testid='translatedtext-qepd' />
        </StyledAddContactButton>
      )}
      <ModalCancelRow
        confirmText={<TranslatedText
          stringId="general.action.close"
          fallback="Close"
          data-testid='translatedtext-jbco' />}
        confirmColor="primary"
        onConfirm={onClose}
      />
    </>
  );
};
