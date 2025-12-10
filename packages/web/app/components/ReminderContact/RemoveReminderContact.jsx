import React, { useState } from 'react';
import styled from 'styled-components';

import { Box, CircularProgress, Divider, Typography } from '@material-ui/core';
import { FormConfirmCancelBackRow } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';

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

export const RemoveReminderContact = ({
  selectedContact,
  onBack,
  onClose,
  pendingContacts,
  successContactIds,
}) => {
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
      <StyledHeading data-testid="styledheading-ffp8">
        <TranslatedText
          stringId="patient.details.removeReminderContact.confirmation"
          fallback="Would you like to remove the below contact?"
          data-testid="translatedtext-lg2y"
        />
      </StyledHeading>
      <StyledSubHeading data-testid="styledsubheading-m0c6">
        <TranslatedText
          stringId="patient.details.removeReminderContact.description"
          fallback="You can add the contact again at any time."
          data-testid="translatedtext-fbqb"
        />
      </StyledSubHeading>
      <ContactDetails
        selectedContact={selectedContact}
        isRemoveModal
        pendingContacts={pendingContacts}
        successContactIds={successContactIds}
        data-testid="contactdetails-lsll"
      />
      <StyledFullWidthContainer data-testid="styledfullwidthcontainer-i1t0">
        <StyledDivider data-testid="styleddivider-yv34" />
      </StyledFullWidthContainer>
      <FormConfirmCancelBackRow
        onBack={onBack}
        onConfirm={handleDeleteContact}
        onCancel={onClose}
        confirmText={
          !isDeleting ? (
            <TranslatedText
              stringId="general.action.remove"
              fallback="Remove"
              data-testid="translatedtext-o1p3"
            />
          ) : (
            <CircularProgress size={16} color="#fff" data-testid="circularprogress-9m64" />
          )
        }
        data-testid="formconfirmcancelbackrow-2d10"
      />
    </>
  );
};
