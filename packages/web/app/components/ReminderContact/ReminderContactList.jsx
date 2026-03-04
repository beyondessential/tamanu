import React from 'react';
import styled from 'styled-components';

import { Button } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';

import { PlusIcon } from '../../assets/icons/PlusIcon';
import { useAuth } from '../../contexts/Auth';
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

export const ReminderContactList = ({
  onClose,
  onAddContact,
  pendingContacts,
  onRetry,
  successContactIds,
  onRemoveContact,
}) => {
  const { ability } = useAuth();
  const canAddReminderContacts = ability.can('write', 'Patient');

  return (
    <>
      <ContactDetails
        pendingContacts={pendingContacts}
        onRetry={onRetry}
        successContactIds={successContactIds}
        onRemoveContact={onRemoveContact}
        data-testid="contactdetails-6in2"
      />
      {canAddReminderContacts && (
        <StyledAddContactButton
          variant="outlined"
          color="primary"
          size="small"
          onClick={onAddContact}
          data-testid="styledaddcontactbutton-rrqt"
        >
          <PlusIcon fill={Colors.primary} data-testid="plusicon-fts6" />
          <TranslatedText
            stringId="patient.details.reminderContacts.action.add"
            fallback="Add contact"
            data-testid="translatedtext-e4pr"
          />
        </StyledAddContactButton>
      )}
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
