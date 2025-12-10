import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import { Button, TranslatedText } from '@tamanu/ui-components';
import { ReminderContactModal } from './ReminderContactModal';
import { useAuth } from '../../contexts/Auth';

const StyledButton = styled(Button)`
  padding: 6px 8px !important;
`;

const StyledNotificationsNoneIcon = styled(NotificationsNoneIcon)`
  margin-right: 5px !important;
`;

export const ReminderContactSection = () => {
  const [openReminderModal, setOpenReminderModal] = useState(false);
  const { ability } = useAuth();
  const canReadReminderContacts = ability.can('read', 'Patient');

  const handleOpenRemindersModal = useCallback(() => {
    setOpenReminderModal(true);
  }, []);

  const onClose = useCallback(() => {
    setOpenReminderModal(false);
  }, []);

  if (!canReadReminderContacts) {
    return null;
  }

  return (
    <>
      <StyledButton
        variant="outlined"
        color="primary"
        size="small"
        onClick={handleOpenRemindersModal}
        data-testid="styledbutton-a229"
      >
        <StyledNotificationsNoneIcon data-testid="stylednotificationsnoneicon-0uid" />
        <TranslatedText
          stringId="patient.details.reminderContacts.title"
          fallback="Reminder contacts"
          data-testid="translatedtext-yq45"
        />
      </StyledButton>
      <ReminderContactModal
        open={openReminderModal}
        onClose={onClose}
        data-testid="remindercontactmodal-efge"
      />
    </>
  );
};
