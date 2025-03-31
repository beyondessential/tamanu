import React, { useState } from 'react';
import styled from 'styled-components';

import { Box, CircularProgress, Divider, Typography } from '@material-ui/core';

import { Colors } from '../../constants';
import { FormConfirmCancelBackRow } from '../ButtonRow';
import { TranslatedText } from '../Translation/TranslatedText';
import { useApi } from '../../api';
import { ContactDetails } from './ContactDetails';

const StyledHeading = styled(Typography)`
  margin: 6px 0 9px 0;
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
`;

const StyledSubHeading = styled(Typography)`
  margin: 0;
  font-size: 14px;
  line-height: 18px;
`;

const StyledFullWidthContainer = styled(Box)`
  margin: 0 -32px 21px;
  grid-column: 1 / -1;
`;

const StyledDivider = styled(Divider)`
  border-top: 1px solid ${Colors.outline};
`;

export const RemoveReminderContact = ({ selectedContact, onBack, onClose, pendingContacts, successContactIds }) => {
  const api = useApi();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteContact = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    await api.delete(`patient/reminderContact/${selectedContact.id}`);
    onBack();
    setIsDeleting(false);
  };

  return (
    <>
      <StyledHeading>
        <TranslatedText
          stringId="patient.details.removeReminderContact.confirmation"
          fallback="Would you like to remove the below contact?"
          data-testid='translatedtext-3quu' />
      </StyledHeading>
      <StyledSubHeading>
        <TranslatedText
          stringId="patient.details.removeReminderContact.description"
          fallback="You can add the contact again at any time."
          data-testid='translatedtext-04xv' />
      </StyledSubHeading>
      <ContactDetails
        selectedContact={selectedContact}
        isRemoveModal
        pendingContacts={pendingContacts}
        successContactIds={successContactIds}
      />
      <StyledFullWidthContainer>
        <StyledDivider />
      </StyledFullWidthContainer>
      <FormConfirmCancelBackRow
        onBack={onBack}
        onConfirm={handleDeleteContact}
        onCancel={onClose}
        confirmText={
          !isDeleting
          ? <TranslatedText
            stringId="general.action.remove"
            fallback="Remove"
            data-testid='translatedtext-4rkh' />
          : <CircularProgress size={16} color="#fff" />
        }
      />
    </>
  );
};
